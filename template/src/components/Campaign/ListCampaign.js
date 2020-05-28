import React from "react";
import {
  Table,
  Input,
  Divider,
  Button,
  Typography,
  DatePicker,
  Row,
  Col,
  Icon
} from "antd";
import { listCampaign } from "../../store/na_mart_up_store/actions"
import { deepCopy } from "../../configs/utils";
const { status, campaignArea } = require("../../configs/constants.js")
import * as moment from "moment";
import { Link } from "react-router-dom";
import { withRouterAndPaths } from "../Home/RoutePath"

const { RangePicker } = DatePicker;
const { connect } = require('react-redux')
const { Text } = Typography;

class ListCampaign extends React.PureComponent {
  /**
   * Renders a client-side sortable campaign list based on the full content of database
   * @param {Object} props
   * @param {Object} props.history - React router history
   * @param {Object} props.paths - React router paths
   * 
   * @param {Array<Object>} props.campaignList - Result of listCampaign API call
   * 
   * @param {Function} props.listCampaign - API call to retrieve all Campaigns
   * @param {Function} props.saveValues - Save edited values to the store
   */
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      width: window.innerWidth,
      filter: {}
    };
  }

  componentDidMount() {
    this.props.saveValues({ pageHeaderTitle: "Search campaign" });
  }

  render() {
    console.log("render")
    return (
      <div>
        List Campaign
      </div> 
    );
  };
}

const mapStateToProps = (state) => {
  const list_copy = deepCopy(state.naMartUp.campaignList || []);
  return {
    campaignList: list_copy
  }
};

const mapDispatchToProps = {
  saveValues: (values) => {
    return dispatch => dispatch({
      ...values,
      type: "USER_INPUT"
    });

  },
  listCampaign: listCampaign,
};

export default withRouterAndPaths(connect(mapStateToProps, mapDispatchToProps)(ListCampaign));
