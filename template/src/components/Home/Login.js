import React from "react";
import { Form, Icon, Input, Button, Layout, Modal } from 'antd';
import { updateStore } from "../../store/na_mart_up_store/actions"
import { envconfigs } from '../../configs/constants';
import { refreshToken } from "../../configs/utils";
// @ts-ignore
import logo from "../../../content/dam/na-mart-up/logo.png"
const { connect } = require('react-redux');
var AmazonCognitoIdentity = require('amazon-cognito-identity-js');
import { withRouterAndPaths } from "./RoutePath"
import { getCurrentUser } from "../../configs/utils";

const passwordMinLength = 10;

const createUserObject = (username) => {
  let poolData = {
    UserPoolId: envconfigs.COGNITO_USER_POOL_ID,
    ClientId: envconfigs.COGNITO_CLIENT_ID
  };
  let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  let userData = {
    Username: username,
    Pool: userPool
  };
  return new AmazonCognitoIdentity.CognitoUser(userData);
}

const mapStateToProps = (state) => {
  return {
    isFetching: state.naMartUp.isFetching
  };
};

const mapDispatchToProps = {
  updateStore: updateStore
};

class LoginFormInternal extends React.Component {
  /**
   * Renders a Login form or a Change password form
   * @param {Object} props
   * @param {Object} props.form - Antd Form https://ant.design/components/form/
   * @param {Object} props.history - React router history
   * @param {Object} props.paths - React router paths
   * @param {Object} props.location - React router location parameter
   * 
   * @param {Function} props.goToNewPassword - Update state to render the New password form
   * @param {Function} props.goToChangePassword - Update state to render the New password form
   * @param {Function} props.goToChangePasswordByAdmin - Update state to render the New password form
   * @param {Function} props.updateStore - Update store with given parameters (isFetching to set/hide the waiting spin icon)
   */
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      loginError: false
    };
  }

  handleChangePassword = () => {
    this.props.form.validateFields(['username'], { force: true }, (err, values) => {
      if (!err) {
        this.props.goToChangePassword(values.username)
      }
    });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.updateStore({ isFetching: true });
    this.setState({ loginError: false });
    this.props.form.validateFields((err, values) => {
      if (err) {
        this.props.updateStore({ isFetching: false });
      }
      else {
        this.cognitoUser = createUserObject(values.username);
        var authenticationData = {
          Username: values.username,
          Password: values.password,
        };
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
        this.cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: (result) => {
            //var accessToken = result.getAccessToken().getJwtToken();
            /* Use the idToken for Logins Map when Federating User Pools with identity pools or when passing through an Authorization Header to an API Gateway Authorizer*/
            refreshToken(() => {
              this.props.updateStore({ isFetching: false });
              this.props.history.replace((this.props.location.state || {}).from || this.props.paths.homeLink());
            });
          },

          onFailure: (err) => {
            this.props.updateStore({ isFetching: false });
            console.log(err);
            if (err.code === "PasswordResetRequiredException") {
              Modal.info({
                title: 'Your password was reset',
                content: (
                  <div>
                    <p>Your password was reset by the administrator.<br />
                      Please check your emails, you will be invited to input a
                      verification code in the next screen.
                    </p>
                  </div>
                ),
                onOk: () => { this.props.goToChangePasswordByAdmin(values.username) },
              });
            }
            else {
              this.setState({ loginError: "Your username or password is incorrect" });
            }
          },

          newPasswordRequired: (userAttributes, requiredAttributes) => {
            // User was signed up by an admin and must provide new
            // password and required attributes, if any, to complete
            // authentication.

            // the api doesn't accept this field back
            delete userAttributes.email_verified;
            console.log("LOGIN SUCCESS - Modify password")
            console.log(userAttributes, requiredAttributes)

            // store userAttributes on global variable
            this.props.goToNewPassword(this.cognitoUser, userAttributes);
            this.props.updateStore({ isFetching: false });
          }
        });
      }
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    return <Form
      key="login"
      onSubmit={this.handleSubmit}
      className="login-form"
    >
      <img src={logo} style={{ width: "100%" }}></img>
      <div>&nbsp;</div>
      {this.state.loginError ? <div style={{ color: "red" }}>{this.state.loginError}</div> : null}
      <Form.Item>
        {getFieldDecorator('username', {
          rules: [{ required: true, whitespace: true, message: 'Please input your username' }],
        })(
          <Input
            prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
            placeholder="Username"
          />,
        )}
      </Form.Item>
      <Form.Item>
        {getFieldDecorator('password', {
          rules: [{ required: true, message: 'Please input your password' }],
        })(
          <Input
            prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
            type="password"
            placeholder="Password"
          />,
        )}
      </Form.Item>
      <Form.Item>
        <a className="login-form-forgot" onClick={this.handleChangePassword}>
          Forgot password
        </a>
        <Button type="primary" htmlType="submit" className="login-form-button">
          Log in
        </Button>
      </Form.Item>
    </Form>;
  }
}

const WrappedLoginForm = Form.create({ name: 'login' })(LoginFormInternal);

/**
 * @type {React.ComponentClass}
 */
const LoginForm = withRouterAndPaths(connect(mapStateToProps, mapDispatchToProps)(WrappedLoginForm));


class ChangePasswordFormInternal extends React.Component {
  /**
   * Renders form to change password
   * @param {Object} props
   * @param {Object} props.history - React router history
   * @param {Object} props.paths - React router paths
   * @param {Object} props.location - React router location parameter
   * 
   * @param {*} props.cognitoUser - Cognito user class returned by Cognito SDK
   * @param {Boolean} props.sendOTP - Set as true to send an OTP by email to the user
   * @param {Object} props.username - Login username
   * @param {Object} props.sessionUserAttributes - User attributes to be passed once changing password after first login
   * @param {Boolean} props.firstLogin - Set as true if it's the first time the user logs in
   * 
   * @param {Function} props.updateStore - Update store with given parameters (isFetching to set/hide the waiting spin icon)
   * @param {Function} props.goToLogin - Go back to Login form after first login forced password change
   * @param {Object} props.form - Antd Form https://ant.design/components/form/
   */
  constructor(props) {
    super(props);
    this.props = props;
    this.cognitoUser = props.cognitoUser || createUserObject(props.username);

    if (props.sendOTP) {
      this.props.updateStore({ isFetching: true });
      this.cognitoUser.forgotPassword({
        onSuccess: (data) => {
          // successfully initiated reset password request
          console.log('data: ', data);

          this.props.updateStore({ isFetching: false });
          Modal.info({
            title: 'Change password OTP',
            content: (
              <div>
                <p>Please check your emails ({data.CodeDeliveryDetails.Destination}), you will be invited to input a
                  verification code (OTP) in the next screen.
                </p>
              </div>
            ),
            onOk: () => { },
          });
        },
        onFailure: (err) => {
          this.props.updateStore({ isFetching: false });
          Modal.error({
            title: 'Error',
            content: (
              <div>
                <p>{err.message || JSON.stringify(err)}</p>
              </div>
            ),
            onOk: () => { },
          });
        }
      });
    }

    this.state = {
      confirmDirty: false,
      changePasswordError: false
    };
  }


  handleConfirmBlur = e => {
    const { value } = e.target;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  };

  validateToNextPassword = (rule, value, callback) => {
    const { form } = this.props;
    if (value && this.state.confirmDirty) {
      form.validateFields(['confirm'], { force: true });
    }
    callback(this.validateComplexity(value));
  };

  compareToFirstPassword = (rule, value, callback) => {
    const { form } = this.props;
    if (value && value !== form.getFieldValue('newPassword')) {
      callback('Two passwords that you enter is inconsistent!');
    }
    callback();
  };

  validateComplexity = (value) => {
    if (value.includes(" ")) {
      return "Your password must not contain spaces"
    }
    else if (value && !new RegExp(`^[=+0-9a-zA-Z\\^\\$\\*\\.\\[\\]\\{\\}\\(\\)\\?\\-"!@#%&\\/\,><':;|_~\`]{1,99}$`).test(value)) {
      return "Your password can only contain uppercase and lowercase latin letters, numbers or these special characters: ^ $ * . [ ] { } ( ) ? - \" ! @ # % & / \ , > < ' : ; | _ ~ `";
    }
    else if (value && !new RegExp(`^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{1,})`).test(value)) {
      // for reference: https://www.thepolyglotdeveloper.com/2015/05/use-regex-to-test-password-strength-in-javascript/
      // Add (?=.*[\\^\\$\\*\\.\\[\\]\\{\\}\\(\\)\\?\\-"!@#%&\\/\,><':;|_~\`]) in regexp to force special characters
      return "Your password must contain lower and upper case letters and a number";
    }
    else if (value.length < passwordMinLength) {
      return `Your password must be at least ${passwordMinLength} characters long`;
    }
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.updateStore({ isFetching: true });
    this.setState({ changePasswordError: false });
    this.props.form.validateFields((err, values) => {
      console.log("validated", err)
      if (err) {
        this.props.updateStore({ isFetching: false });
      }
      else if (this.props.firstLogin) {
        console.log("complete new password challenge", this.props.sessionUserAttributes);
        this.cognitoUser.completeNewPasswordChallenge(values.newPassword, this.props.sessionUserAttributes, {
          onSuccess: (result) => {
            console.log("RESULT", result);
            let idToken = result.idToken.jwtToken;
            refreshToken(() => {
              this.props.updateStore({ isFetching: false });
              this.props.history.replace((this.props.location.state || {}).from || this.props.paths.homeLink());
            });
          },
          onFailure: (err) => {
            this.props.updateStore({ isFetching: false });
            Modal.error({
              title: 'Error',
              content: (
                <div>
                  <p>{err.message || JSON.stringify(err)}</p>
                </div>
              ),
              onOk: () => { },
            });
          }
        });
      }
      else {
        console.log("forgotPassword")
        let authenticationData = {
          Username: this.props.username,
          Password: values.newPassword,
        };
        let authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
        this.cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: () => {
            // Avoid that the user reuses the same password if he wants to change it
            this.setState({ changePasswordError: "You cannot reuse your last password" });
            this.props.updateStore({ isFetching: false });
            this.cognitoUser.globalSignOut({
              onSuccess: () => {},
              onFailure: (err) => {
                if (err) { console.log(err, err.stack); } // an error occurred
              }
            });
          },
          onFailure: () => {
            this.cognitoUser.confirmPassword(values.verificationCode, values.newPassword, {
              onSuccess: () => {
                Modal.info({
                  title: 'Your password was successfully updated',
                  content: (
                    <div>
                      <p>You will be invited to login with your new password in the next screen.</p>
                    </div>
                  ),
                  onOk: () => { this.props.goToLogin() },
                });
                this.props.updateStore({ isFetching: false });
              },
              onFailure: (err) => {
                this.setState({ changePasswordError: "Invalid verification code provided" });
                console.log('Password not confirmed!', err);
                this.props.updateStore({ isFetching: false });
              }
            });
          }
        })
      }
    });
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    return <Form key="fp" onSubmit={this.handleSubmit} className="login-form" >
      <img src={logo} style={{ width: "100%", paddingBottom: "15px" }}></img>
      <div style={{ margin: "12px 0 12px 0" }} >
        <div style={{ fontWeight: 600 }} > Configure new password</div>
        Your password must contain:<br />
        - lower and upper case letters, <br />
        - a number
        </div>
      {this.state.changePasswordError ? <div style={{ color: "red" }} >{this.state.changePasswordError}</div> : null}
      {this.props.firstLogin ? null :
        <Form.Item>
          {getFieldDecorator('verificationCode', {
            rules: [
              {
                required: true,
                message: 'Please input your verification code',
              }
            ],
          })(<Input autoComplete="new-password" placeholder="Verification code" />)}
        </Form.Item>}
      <Form.Item >
        {getFieldDecorator('newPassword', {
          validateFirst: true,
          rules: [
            {
              required: true,
              message: 'Please input your password',
            },
            {
              validator: this.validateToNextPassword,
            },
          ],
        })(<Input.Password
          autoComplete="new-password"
          prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
          type="password"
          placeholder="New Password" />)}
      </Form.Item>
      <Form.Item >
        {getFieldDecorator('confirm', {
          validateFirst: true,
          rules: [
            {
              validator: this.compareToFirstPassword,
            },
          ],
        })(<Input.Password
          autoComplete="new-password"
          prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
          type="password"
          placeholder="Confirm New Password" onBlur={this.handleConfirmBlur} />)}
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" className="login-form-button">
          Change password
        </Button>
      </Form.Item>
    </Form>;
  }
}

const WrappedChangePasswordForm = Form.create({ name: 'login' })(ChangePasswordFormInternal);

const ChangePasswordForm = withRouterAndPaths(connect(mapStateToProps, mapDispatchToProps)(WrappedChangePasswordForm));



class NormalLoginForm extends React.Component {
  /**
   * Renders a Login form or a Change password form
   * @param {Object} props
   * @param {Object} props.history - React router history
   * @param {Object} props.paths - React router paths
   * 
   * @param {Boolean} props.changePassword - Set as true if the user clicked change password
   * @param {Function} props.goToNewPassword - Update state to render the New password form
   */
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      displayForm: "login"
    }
  }

  componentDidMount() {
    if (this.props.changePassword) {
      this.cognitoUser = getCurrentUser();
      if (!this.cognitoUser) {
        Modal.error({
          title: "Error",
          content: <div><p>Please enter your username and click on the "Forgot password" link</p></div>,
          onOk: () => { this.props.history.push(this.props.paths.loginLink()) }
        });
      }
      else {
        this.goToChangePassword(this.cognitoUser.username);
      }
    }
  }

  static defaultProps = {
    isFetching: false,
  }

  goToChangePassword = (username) => {
    this.setState({
      displayForm: "changePassword",
      changePasswordData: {
        username: username,
        sendOTP: true
      }
    });
  }

  goToChangePasswordByAdmin = (username) => {
    this.setState({
      displayForm: "changePassword",
      changePasswordData: {
        username: username,
        sendOTP: false
      }
    });
  }

  goToNewPassword = (cognitoUser, sessionUserAttributes) => {
    this.setState({
      displayForm: "changePassword",
      changePasswordData: {
        cognitoUser: cognitoUser,
        sessionUserAttributes: sessionUserAttributes,
        firstLogin: true
      }
    });
  }

  goToLogin = () => {
    this.setState({ displayForm: "login" });
  }

  render() {
    const displayForm = this.state.displayForm;

    return (
      <Layout className="login-body">
        {displayForm === "login" ?
          <LoginForm
            goToChangePassword={this.goToChangePassword}
            goToChangePasswordByAdmin={this.goToChangePasswordByAdmin}
            goToNewPassword={this.goToNewPassword}
          /> :
          displayForm === "changePassword" ?
            <ChangePasswordForm
              {...this.state.changePasswordData}
              goToLogin={this.goToLogin}
            /> :
            null
        }
      </Layout>
    );
  }
}

/**
 * @type {React.ComponentClass}
 */
const WrappedNormalLoginForm = withRouterAndPaths(connect(mapStateToProps, mapDispatchToProps)(NormalLoginForm));
export default WrappedNormalLoginForm;
