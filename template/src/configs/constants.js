/**
 * List of Environments
 * DEV  :   Development
 * UAT  :   Quality Assurance (QAS)
 * PRD  :   Production
 */
let env = "DEV";
if (/uat\-url\.com/i.test(window.location.hostname)) {
  env = "UAT";
} else if (/prod\-url\.com/i.test(window.location.hostname)) {
  env = "PRD";
}
console.log("Current environment:", env);

export const initialState = {
  "campaign_info": {}
};

export const envconfigs = {};

envconfigs.AWS_REGION = "ap-southeast-1";
envconfigs.ENV = env;
if (env == "DEV") {
  envconfigs.HOST = "https://abcdefghij.execute-api.ap-southeast-1.amazonaws.com/dev";
  envconfigs.COGNITO_IDENTITY_POOL_ID = "ap-southeast-1:abcdefghij-abcdefghij-abcdefghij";
  envconfigs.COGNITO_USER_POOL_ID = "ap-southeast-1_abcdefghij";
  envconfigs.COGNITO_CLIENT_ID = "abcdefghijabcdefghijabcdefghij";
  envconfigs.UPLOAD_BUCKET_NAME = "";
  envconfigs.DOWNLOAD_BUCKET_NAME = "";
} else if (env == "UAT") {
  envconfigs.HOST = "https://abcdefghij.execute-api.ap-southeast-1.amazonaws.com/uat";

} else if (env == "PRD") {
  envconfigs.HOST = "https://abcdefghij.execute-api.ap-southeast-1.amazonaws.com/prd";

}

export function retrieveNiceName (arr, code) {
    for (let i=0; i<arr.length; i++) {
        if (arr[i].code === code) {
            return arr[i].name;
        }
    }
}

export const initiative = [
  {
      "code" : "UPSELL",
      "name" : "Upsell"
  },
  {
      "code" : "XSELL",
      "name" : "Cross-sell"
  },
  {
      "code" : "ENG",
      "name" : "Engagement"
  },
  {
      "code" : "ACQ",
      "name" : "Acquisition"
  },
  {
      "code" : "ACT",
      "name" : "Activation"
  },
  {
      "code" : "RET",
      "name" : "Retention"
  },
  {
      "code" : "REACT",
      "name" : "Reactivation"
  }
]

