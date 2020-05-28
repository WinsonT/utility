import { envconfigs } from '../configs/constants';
import { host, pathFunctions } from "../components/Home/RoutePath";
import { initiative, retrieveNiceName } from "./constants";
import Cookies from 'universal-cookie';
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
/**
 * @type {*}
 */
const AWS = require('aws-sdk');
/**
 * Get current logged in user using AWS
 * @returns {*}
 */
export const getCurrentUser = () => {
  var poolData = {
    UserPoolId: envconfigs.COGNITO_USER_POOL_ID,
    ClientId: envconfigs.COGNITO_CLIENT_ID
  };
  var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  return userPool.getCurrentUser();
}

/**
 * @callback RefreshCallback
 * @param {String} idToken - Refreshed token
 * @param {*} cognitoUser - Authenticated cognito user
 */
/**
 * Refresh token before calling API (token expires every hour)
 * @param {RefreshCallback} callback
 */
export const refreshToken = (callback) => {
  var cognitoUser = getCurrentUser();
  if (!AWS.config.credentials) {
    AWS.config.region = envconfigs.AWS_REGION
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: envconfigs.COGNITO_IDENTITY_POOL_ID,
    });
  }
  if (cognitoUser) {
    cognitoUser.getSession(function (err, session) {
      if (err) {
        console.log(err);
        if (/expired/i.test(err.message)) {
          cognitoUser.signOut();
          window.open("/", "_self");
        }
        return;
      }
      const cookie = new Cookies();
      let oneWeek = new Date();
      oneWeek.setDate(oneWeek.getDate() + 7);
      let refresh_token = session.getRefreshToken();
      console.log('needsRefresh', AWS.config.credentials.needsRefresh());
      if (AWS.config.credentials.needsRefresh()) {
        cognitoUser.refreshSession(refresh_token, (err, session) => {
          if (err) {
            console.log("Error while refreshing", err);
            if (/expired/i.test(err.message)) {
              cognitoUser.signOut();
              location.reload();
            }
          }
          else {
            if (!AWS.config.credentials.params.Logins) {
              AWS.config.credentials.params.Logins = {}
            }
            AWS.config.credentials.params.Logins[`cognito-idp.${envconfigs.AWS_REGION}.amazonaws.com/${envconfigs.COGNITO_USER_POOL_ID}`] = session.getIdToken().getJwtToken();
            AWS.config.credentials.refresh((err) => {
              if (err) {
                console.log("Error while refreshing credentials", err);
              }
              else {
                let userGroups = session.idToken.payload['cognito:groups'] || [];
                console.log(userGroups);
                cookie.set("userGroups", userGroups.join(','), { path: '/', expires: oneWeek });
                let idToken = session.getIdToken().getJwtToken();
                console.log("TOKEN SUCCESSFULLY UPDATED");
                if (callback) callback(idToken, cognitoUser);
              }
            });
          }
        });
      }
      else {
        let userGroups = session.idToken.payload['cognito:groups'] || [];
        console.log(userGroups);
        cookie.set("userGroups", userGroups.join(','), { path: '/', expires: oneWeek });
        if (callback) callback(session.getIdToken().getJwtToken(), cognitoUser);
      }
    })
  }
  else {
    window.open("/", "_self");
  }
}


/**
 * Returns a deep copy of the nested object. Values must be list, string, or numbers
 * @param {Object} nestedObj - An object that needs more than shallow copy
 */
export const deepCopy = (nestedObj) => {
  return JSON.parse(JSON.stringify(nestedObj))
}
