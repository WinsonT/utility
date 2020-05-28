import React from "react";
import { withRouter } from "react-router";

export const paths = {
  home: "/",
  calendar: "/calendar",
  campaign: "/campaign/:id(CODE-[0-9]{3,})?",
  login: "/login",
  changePassword: "/change-password",
  logout: "/logout"
}

export const host = window.location.protocol + "//" + window.location.host + "/#"; // Assumes HashRouter

/**
 * Path to the different pages of the app
 */
export const pathFunctions = {
  homePath: () => paths.home,
  homeLink: () => paths.home,

  calendarPath: () => paths.calendar,
  calendarLink: () => paths.calendar,

  campaignPath: () => paths.campaign,
  campaignLink: (id) => id ? `/campaign/${id}` : "/campaign",

  loginPath: () => paths.login,
  loginLink: () => paths.login,

  changePasswordPath: () => paths.changePassword,
  changePasswordLink: () => paths.changePassword,

  logoutPath: () => paths.logout,
  logoutLink: () => paths.logout,
}

export const withRouterAndPaths = (Wrapped) => {
  return withRouter(({ ...otherProps }) => (
    <Wrapped {...otherProps} paths={pathFunctions} host={host} />
  ));
}
