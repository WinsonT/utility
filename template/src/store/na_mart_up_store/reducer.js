import * as types from './actionTypes'
import { initialState } from "../../configs/constants"

const naMartUp = (state = initialState, action) => {
  switch (action.type) {
    case types.ASSIGN_MESSAGE:
    case types.USER_INPUT:
      return Object.assign({}, state, action);

    case types.CAMPAIGN_CREATED:
      const newState = {
        campaign_info: {...action.campaign_info} 
      };
      return Object.assign({}, state, newState);

    case types.ERROR:
      return Object.assign({}, state, { error: action.error, isFetching: action.isFetching });

    default:
      return state
  }
}

export default naMartUp
