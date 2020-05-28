import { refreshToken } from "../../configs/utils";
import { envconfigs } from '../../configs/constants';
import * as types from './actionTypes'
const AWS = require('aws-sdk');

/**
 * Update store with an object parameter
 * @param {*} flatObj - An object that has no nested values {a:"xx",b:"yy",...}
 */
export const updateStore = flatObj => {
  return dispatch => dispatch({ ...flatObj, type: types.USER_INPUT })
}

/**
 * GET Campaign API call
 * @param {String} campaign_id - Campaign ID to request
 * @param {Function} callback - Callback to be called after the API call
 */
export const getCampaign = (campaign_id, callback = () => { }) => {
  return dispatch => {
    refreshToken((token) => {
      fetch(envconfigs.HOST + "/campaign/" + campaign_id, {
        method: "get",
        headers: {
          "Content-Type": "application/json",
          Authorization: token
        }
      })
        .then(res => {
          const err = !res.ok;
          if (err) {
            callback(err);
          } else {
            res.json().then(response => {
              console.log("response", response)
              callback(err, response);
            });
          }
        })
        .catch(error => {
          dispatch({ error: error, type: "ERROR" });
          console.error(error);
          callback(true);
        });
    })
  }
};

/**
 * @callback ErrorCallback
 * @param {Boolean} error - Set as true if an error happened
 */
/**
 * PUT create/update campaign
 * @param {Object} campaignInfo - Campaign data {coming from | to be sent to} backend
 * @param {ErrorCallback} callback 
 */
export const createCampaign = (campaignInfo, callback) => {
  return dispatch => {
    refreshToken((token) => {
      const apiParam = campaignInfo;
      console.log(apiParam);
      fetch(envconfigs.HOST + "/campaign", {
        method: "put",
        headers: {
          "Content-Type": "application/json",
          Authorization: token
        },
        body: JSON.stringify(apiParam,
          (key, value) => {
            if (value !== null && value !== "" && value !== undefined) return typeof (value) === "object" ? value : String(value)
          }
        )
      })
        .then(res => {
          const err = !res.ok;
          if (err) {
            callback(err);
          } else {
            res.json().then(response => {
              console.log("response", response)
              dispatch({ campaign_info: response, type: "CAMPAIGN_CREATED" });
              callback(err);
            });
          }
        })
        .catch(error => {
          dispatch({ error: error, type: "ERROR" });
          console.error(error);
          callback(true);
        });
    })
  }
};

/**
 * @callback UploadCallback
 * @param {File} file - JS File object representing the file to upload
 * @param {Number} index - File index
 * @param {Object} error - Contains all errors
 */
/**
 * Upload the target list file to S3
 * @param {File} file - JS File object representing the file to upload
 * @param {Number} index - File index
 * @param {String} fileKey - Key (file name) in S3 which must be unique per bucket
 * @param {UploadCallback} cb - Callback
 */
export const uploadTargetList = (file, index, fileKey, cb) => {
  return dispatch => {
    refreshToken(() => {
      const s3 = new AWS.S3();
      s3.upload({
        Key: fileKey,
        Body: file,
        Bucket: envconfigs.UPLOAD_BUCKET_NAME
      }, function (err, data) {
        if (cb) cb(file, index, err);
      });
    });
  }
};

/**
 * PUT Update backend DB with updated file references
 * @param {File} file - JS File object representing the file to upload
 * @param {Number} index - File index
 * @param {String} fileKey - Key (file name) in S3 which must be unique per bucket
 * @param {UploadCallback} callback 
 */
export const updateCampaignWithFile = (file, index, fileKey, callback) => {
  return dispatch => {
    refreshToken((token) => {
      const apiParam = { filename: fileKey };
      console.log(apiParam);
      fetch(envconfigs.HOST + "/target-list", {
        method: "put",
        headers: {
          "Content-Type": "application/json",
          Authorization: token
        },
        body: JSON.stringify(apiParam)
      })
        .then(res => {
          const err = !res.ok;
          if (err) {
            callback(file, index, err);
          } else {
            res.json().then(response => {
              console.log("file", file)
              callback(file, index, err);
            });
          }
        })
        .catch(error => {
          console.error(error);
          callback(file, index, true);
        });
    });
  }
};

/**
 * GET all campaign data as a list
 */
export const listCampaign = () => {
  return dispatch => {
    dispatch({ isFetching: true, type: "USER_INPUT" });
    refreshToken((token) => {
      fetch(envconfigs.HOST + "/campaign",
        { headers: { Authorization: token } })
        .then(res => res.json())
        .then(response => {
          response.sort((a, b) => a.create_dttm + a.campaign_id > b.create_dttm + b.campaign_id ? -1 : 1)
          dispatch({ isFetching: false, campaignList: response, type: "USER_INPUT" })
        })
        .catch(error => {
          dispatch({ error: error, isFetching: false, type: "ERROR" });
          console.error(error);
        });
    });
  }
}
