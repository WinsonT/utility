import React from "react";
import { getCurrentUser, refreshToken } from "../../configs/utils";
import { withRouterAndPaths } from "./RoutePath"
/**
 * @type {*}
 */
const AWS = require('aws-sdk');

function logout(props) {
  const user = getCurrentUser();
  refreshToken((_, cognitoUser) => {
    if (cognitoUser) cognitoUser.globalSignOut({
      onSuccess: () => {
        if (AWS.config.credentials) AWS.config.credentials.clearCachedId();
        props.history.push(props.paths.homeLink());
      },
      onFailure:(err) => {
      if (err) { console.log(err, err.stack); } // an error occurred
    }});
  })

  return <div></div>;
}

export default withRouterAndPaths(logout);