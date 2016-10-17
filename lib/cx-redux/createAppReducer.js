import {REPLACE_STATE} from './actions';

export function createAppReducer(reducer) {
   return (state, action) => {
      if (action.type == REPLACE_STATE)
         return action.state;

      return reducer(state, action);
   }
}
