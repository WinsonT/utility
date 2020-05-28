import React, { Component } from "react";
import {
  Layout,
  Spin,
  Row,
  Col,
  Icon
} from 'antd';
import { getCurrentUser } from "../../configs/utils";
import { Switch, Route, Redirect, Link } from "react-router-dom";
import { paths } from "./RoutePath"

import GlobalMenu from "../Menu/menu.js";
import Campaign from "../Campaign/Campaign.js";
import ListCampaign from "../Campaign/ListCampaign.js";
import WrappedNormalLoginForm from "../Home/Login";
import Logout from "../Home/Logout";

const { Content, Sider } = Layout;
const { connect } = require('react-redux')


class Home extends Component {
  /**
   * Route the URL to the correct page
   * @param {Object} props
   * @param {Boolean} props.isFetching - Store flag which decides if the waiting spin icon should appear and block actions
   */
  constructor(props) {
    super(props);
    this.props = props;
  }

  static defaultProps = {
    isFetching: false,
  }

  // PrivateRoute must not be declared inside render, else it causes 
  // infinite loop if child performs dispatch in constructor.
  PrivateRoute = ({ render, ...rest }) => {
    return (
      <Route
        {...rest}
        render={props => {
          // Remove the true || part to activate redirect to login if not authenticated.
          if (true || getCurrentUser()) {
            return render(props);
          } else {
            return (<Redirect
              to={{
                pathname: paths.login,
                state: {
                  from: props.location
                }
              }}
            />)
          }
        }}
      />
    );
  }

  render() {
    const PrivateRoute = this.PrivateRoute;
    const spinIcon = <Icon type="loading" style={{ fontSize: 60, color: "rgb(119,67,171)" }} spin />;

    return (
      <Switch>
        <Route exact path={paths.login}>
          <Spin spinning={this.props.isFetching} indicator={spinIcon} style={{ margin: "-20px" }}>
            <WrappedNormalLoginForm key="login" />
          </Spin>
        </Route>
        <PrivateRoute exact path={paths.changePassword} render={(props) =>
          <Spin spinning={this.props.isFetching} indicator={spinIcon} style={{ margin: "-20px" }}>
            <WrappedNormalLoginForm key="changepass" changePassword={true} />
          </Spin>
        } />
        <PrivateRoute render={(props) =>
          <Layout className="layout">
            <Content>
              <Layout>
                <Sider collapsed={true} style={{ height: "100vh" }} collapsedWidth={64} >
                  <GlobalMenu />
                  {
                    // Any other hidden components can be inserted here. E.g., messaging component.
                  }
                </Sider>
                <Layout>
                  <Row type="flex" align="middle" gutter={18} style={{ padding: "24px 32px 14px 32px", borderBottom: "0px solid #d9d9d9" }} >
                    <Col style={{ height: "24px", cursor: "default" }}>
                      <Link to={paths.home} >HEADER / TITLE</Link>
                    </Col>
                  </Row>
                  <Spin spinning={this.props.isFetching} indicator={spinIcon} style={{ margin: "-20px" }}>
                    <Content style={{ margin: "0 32px" }}>
                      <Switch>
                        <Route path={paths.logout}> <Logout /> </Route>
                        <Route path={paths.campaign} render={(props) => {
                          // Apply key based on params to re-mount on path change
                          return <Campaign key={props.match.params.id} />
                        }} />
                        <Route path={paths.home}> <ListCampaign /> </Route>
                      </Switch>
                    </Content>
                  </Spin>
                </Layout>
              </Layout>
            </Content>
          </Layout>
        } />
      </Switch>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    isFetching: state.naMartUp.isFetching,
    pageHeaderTitle: state.naMartUp.pageHeaderTitle
  };
};

const mapDispatchToProps = {

};

export default connect(mapStateToProps, mapDispatchToProps)(Home);
