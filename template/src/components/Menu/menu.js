import React from "react";
import { Menu, Icon, Tooltip } from 'antd';
const { connect } = require('react-redux')
import { getCurrentUser, deepCopy } from "../../configs/utils";
import { Link } from "react-router-dom";
import { withRouterAndPaths } from "../Home/RoutePath"

class GlobalMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = { userSubMenuVisible: false };
  }  

  render() {

    const divStyle = {
      style: {
        position: "fixed",
        display: "flex",
        height: "100vh",
        flexDirection: "column",
        justifyContent: "space-between"
      },
    };
    const user = getCurrentUser() || {};

    const menuItemStyle = {
      WebkitTransition: "0s",
      transition: "0s",
      height: "36px",
      borderRadius: "4px",
      marginLeft: "14px",
      marginRight: "14px",
    }

    return (

      <div {...divStyle}>
        <Menu mode="inline" style={{ padding: "20px 0" }} selectable={false}>
          <Menu.Item style={{ ...menuItemStyle }} >
          <Link to={this.props.paths.homeLink()}> 
            <Icon type="search" style={{ color: "#fff" }}/>
            <span>Search campaign</span>
          </Link>
          </Menu.Item>
          <Menu.Item style={{ ...menuItemStyle }} >
          <Link to={this.props.paths.campaignLink()}> 
            <Icon type="plus" style={{ color: "#fff" }}/>
            <span>Create campaign</span>
          </Link>
          </Menu.Item>
        </Menu>
      </div>

    );
  }
}

const mapStateToProps = (state) => {
  return { 
  };
};

const mapDispatchToProps = {
};

export default withRouterAndPaths(connect(mapStateToProps, mapDispatchToProps)(GlobalMenu));
