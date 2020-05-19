import os 
import re 
import json 
import datetime 
import logging 
import os
 
log = logging.getLogger() 
if log.handlers: 
    HANDLER = log.handlers[0] 
else: 
    HANDLER = logging.StreamHandler() 
    log.addHandler(HANDLER) 
log_format = '[%(levelname)s] %(asctime)s- %(message)s (File %(pathname)s, Line %(lineno)s)' 
HANDLER.setFormatter(logging.Formatter(log_format)) 
log.setLevel(logging.INFO) 

def sgt_now():
    """
    Utility function to get the current SGT datetime.
    :return: datetime object representing the current time in SGT
    """
    return datetime.datetime.utcnow() + datetime.timedelta(hours=8) 

class DictProcessor:
    """ 
    Helper class to validate incoming dict from the request.
    :param dict_defn: metadata that defines the validation to be performed
    :format dict_defn: 
        {
            'metadata' : {
                'required_attr' : [list of required attributes]
            }
            'attr1' : r'...', # regex pattern
            'attr2' : {...} # dict
            'attr3' : [...] # list
        }
    :required_attr: list of attributes that must be present in the input
    :data: a dict whose keys are the list of possible attributes, and 
            whose values are objects with appropriate validate() method
    """
    def __init__(self, dict_defn):
        self.required_attr = dict_defn['metadata']['required_attr']
        self.data = {}
        for key, value in dict_defn.items():
            if key == 'metadata':
                continue
            if isinstance(value, dict):
                self.data[key] = DictProcessor(value)
            elif isinstance(value, list):
                self.data[key] = ListProcessor(value)
            elif isinstance(value, str):
                self.data[key] = ReProcessor(value)


    def validate(self, input_dict):
        """
        Method to validate input_dict.
        :param input_dict: the input to be validated from incoming request
        :type input_dict: dict
        :return: A boolean if the input is valid or not
        """
        if not isinstance(input_dict, dict):
            log.info('TypeError: expected dict type.') 

        for attr in self.required_attr:
            if attr not in input_dict:
                log.info('Required attribute not found: {}.'.format(attr)) 
                return False

        for attr, value in input_dict.items():
            if attr not in self.data:
                log.info('Input attribute is not supported: {}.'.format(attr)) 
                return False

            if not self.data[attr].validate(value):
                log.info('Error encountered when validating: attr "{}" value "{}".'.format(attr, value)) 
                return False

        return True

class ListProcessor:
    """ 
    Helper class to validate incoming list of dict from the request.
    :param list_defn: metadata that defines the validation to be performed
    :format list_defn: 
        [
            {
                'minlen' : min number of entries,
                'maxlen' : max number of entries
            },
            dict_defn OR re_defn  # See DictProcessor class for dict_defn metadata format
                                  # See ReProcessor class for re_defn metadata format
        ]
    :minlen: minimum number of entries that must be present in the input
    :maxlen: maximum number of entries that must be present in the input
    :processor: DictProcessor object to validate each entry in the list
    """
    def __init__(self, list_defn):
        self.minlen = list_defn[0]['minlen']
        self.maxlen = list_defn[0]['maxlen']
        if isinstance(list_defn[1], dict):
            self.processor = DictProcessor(list_defn[1])
        elif isinstance(list_defn[1], str):
            self.processor = ReProcessor(list_defn[1])

    def validate(self, input_list):
        """
        Method to validate input_list.
        :param input_list: the input to be validated from incoming request
        :type input_list: list
        :return: A boolean if the input is valid or not
        """
        if not isinstance(input_list, list):
            log.info('TypeError: expected list type.') 

        if not (self.minlen <= len(input_list) <= self.maxlen):
            log.info(
                'List length must be between {} and {}: {} received'.format(
                    self.minlen, 
                    self.maxlen, 
                    len(input_list)
                )
            )
            return False

        for entry in input_list:
            if not self.processor.validate(entry):
                log.info('Error encountered when validating: list entry "{}".'.format(entry)) 
                return False

        return True

class ReProcessor:
    """ 
    Helper class to validate incoming string from the request.
    :param re_defn: regex that defines the validation to be performed
    :re_pattern: regex pattern against which the input must match
    """
    def __init__(self, re_defn):
        self.re_pattern = re_defn

    def validate(self, input_str):
        """
        Method to validate input_str.
        :param input_str: the input to be validated from incoming request
        :type input_str: str
        :return: A boolean if the input is valid or not
        """
        if not isinstance(input_str, str):
            log.info('TypeError: expected str type.') 

        if re.match(self.re_pattern, input_str) is None:
            log.info('Invalid data provided: {}.'.format(input_str))
            return False

        return True 


class EventCreator:
    """
    Example class that uses the validator classes.
    :event_defn: metadata defining the validations required for input data
    :validator: object with callable .validate() method to validate input
    """
    event_defn = {
        'metadata' : {
            'required_attr' : [
                'event_id', 
                'status', 
                'date_range'
            ]
        },
        'event_id' : r'^WT-[0-9]{3,}$',
        'event_name' : r'^[-():.,/?_ A-Za-z0-9]+$',
        'status' : r'^[-_A-Z0-9]+$',
        'date_range' : [
            {
                'minlen' : 2,
                'maxlen' : 2
            },
            r'^\d{4}-\d{2}-\d{2}$'
        ],
        'event_long_desc' : r'^[-():.,/?_ A-Za-z0-9\r\n]+$',
        'last_update_dttm' : r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?)$',
        'create_dttm' : r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?)$',
        'tg_groups' : [
            {
                'minlen' : 1,
                'maxlen' : 10
            },
            {
                'metadata' : {
                    'required_attr' : [
                        'tg_id'
                    ]
                },
                'tg_id' : r'^WT-[0-9]{3,}-TG[0-9]$',
                'tg_long_desc': r'^[-():.,/?_ A-Za-z0-9]+$',
                'tg_qualifiers' : [
                    {
                        'minlen':0,
                        'maxlen':20
                    },
                    {
                        'metadata' : {
                            'required_attr' : ['qual_code', 'qual_values']
                        },
                        'qual_code' : r'^[-_A-Z0-9]+$',
                        'qual_values' : r'^[-.,_ A-Za-z0-9]+$'
                    }
                ],
                'tg_members' : [
                    {
                        'minlen' : 2,
                        'maxlen' : 10
                    },
                    {
                        'metadata' : {
                            'required_attr' : ['short_name']
                        },
                        'short_name' : r'^[-_A-Za-z0-9]+$',
                        'member_qualifiers' : [
                            {
                                'minlen':0,
                                'maxlen':20
                            },
                            {
                                'metadata' : {
                                    'required_attr' : ['qual_code', 'qual_values']
                                },
                                'qual_code' : r'^[-_A-Z0-9]+$',
                                'qual_values' : r'^[-.,_ A-Za-z0-9]+$'
                            }
                        ]
                    }
                ]
            }
        ]

    } 
    validator = DictProcessor(event_defn)


    def __init__(self, input_data):
        self.input_data = input_data
        self.validated_data =  {}


    def process_input(self):
        """
        Method to process input.
        :return: Bool to indicate if successful
        """
        if not EventCreator.validator.validate(self.input_data):
            log.info('Input data failed validation')
            return False
        self.validated_data = self.input_data

        return True        

if __name__ == '__main__':
    test_json_1 = {
        "event_id" : "WT-009",
        "event_name" : "PC Reactivation 2019",
        "status" : "DRAFTED",
        "date_range" : ["2019-01-12", "2019-01-12"],
        "event_long_desc" : "We believe that, ...\nthe highly anticipated ...\nend.",
        "tg_groups" : [
            {
                "tg_id": "WT-009-TG1",
                "tg_long_desc": "Enter a description ...",
                "tg_qualifiers" : [
                    {
                        "qual_code" : "AREA",
                        "qual_values" : "WEST"
                    },
                    {
                        "qual_code" : "THEME",
                        "qual_values" : "WILD"
                    },
                    {
                        "qual_code" : "DIMENSION",
                        "qual_values" : "1"
                    }
                ],
                "tg_members" : [
                    {
                        "short_name" : "Charlie"
                    },
                    {
                        "short_name" : "Kuma",
                        "member_qualifiers" : [
                            {
                                "qual_code" : "SPECIES",
                                "qual_values" : "BEAR"
                            }
                        ]
                    },
                    {
                        "short_name" : "Timon",
                        "member_qualifiers" : [
                            {
                                "qual_code" : "SPECIES",
                                "qual_values" : "MEERKAT"
                            }
                        ]
                    }
                ]
            }
        ]

    }
    

    event = EventCreator(test_json_1)
    log.info('Process result as follows: {}'.format(event.process_input()))
