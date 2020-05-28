/**
 * rule_defn data structure is based on the backend validator built on AWS Lambda.
 * See Lambda docstring for details. 
 */
const rule_defn = {
  'metadata' : {
    'required_attr' : [
      'campaign_name', 
      'status', 
      'date_range',
      'initiative', 
      'program',
      'campaign_area'
    ]
  },
  'event_id' : [],
  'event_name' : [
    {
      pattern: '^[-_!@#$%&*()\'";:.,/?_ A-Za-z0-9]+$',
      message: 'Invalid characters in input value'
    },
    {
      max: 100,
      message: 'Max. 100 characters'
    }
  ],
  'status' : [],
  'date_range' : [],
  'date_list' : [
    {
      'minlen' : 0,
      'maxlen' : 5
    },
    {
      'metadata' : {
        'required_attr' : ['date', 'name']
      },
      'date' : [],
      'name' : [
        {
          pattern: '^[-_!@#$%&*()\'";:.,/?_ A-Za-z0-9]+$',
          message: 'Invalid characters in input value'
        },
        {
          max: 20,
          message: 'Max. 20 characters'
        }
      ]
    }
  ],
  'last_update_dttm' : [],
  'create_dttm' : [],
  'tg_groups' : [
    {
        'minlen' : 1,
        'maxlen' : 1 
    },
    {
      'metadata' : {
          'required_attr' : ['short_name']
      },
      'short_name' : [
        {
          pattern: '^CODE[0-9] .+$',
          message: 'Please enter short name'
        },
        {
          pattern: '^CODE[0-9] [^ ]+$',
          message: 'Spaces are not allowed'

        },
        {
          pattern: '^CODE[0-9] [a-zA-Z0-9_-]*$', 
          message: 'Valid characters are "A-Z 0-9 _-"'

        },
        {
          max: 30,
          message: 'Max. 30 characters'
        }
      ],
      'sample_number' : [
        {
          max: 1,
          type: 'number',
          message: 'Max. 100',
          transform: (value) => {
            return Number(value);
          }
        },
        {
          min: 0,
          type: 'number',
          message: 'Min. 0',
          transform: (value) => {
            return Number(value);
          }
        }
      ],
    }
  ]
} 

/**
 * attrPath uses . to access object properties and [ ] to access array by index.
 * @param {string} attrPath - ID of the HTML component for which to retrieve the validation rules
 * @returns {Array<Object>} Array of rules
 */
function getRules(attrPath) {
  /**
   * @type {Object|Array}
   */
  let rule = rule_defn;
  let metadata = rule.metadata;
  let attrName = attrPath;
  attrPath.split(".").forEach((attr) => {
    if (attr.includes("[")) {
      rule = rule[attr.replace(/\[[0-9]+\]/g, "")][1];
      metadata = rule.metadata;
    } else {
      rule = rule[attr];
      attrName = attr;
    };
  });

  if (rule !== undefined && rule.findIndex((item) => item.hasOwnProperty('required')) < 0) {
    const strippedAttrName = attrName.indexOf("#") < 0 ? attrName : attrName.substring(0, attrName.indexOf("#"));
    const required = metadata.required_attr.indexOf(strippedAttrName) >= 0;
    rule.push({
      required: required,
      whitespace: required,
      message: 'Field is required',
      transform: (value) => (String(value || ""))
    })
  }
  return rule;
}

export default getRules;