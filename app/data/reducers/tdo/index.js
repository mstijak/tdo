import { migrate } from './migrate';
import { getDefaultData } from './getDefaultData';
import { combineReducers } from 'redux';

import dummy from '../dummyReducer';
import boards from './boards';
import lists from './lists';
import tasks from './tasks';

import {
    REQUEST_TDO, RECEIVE_TDO,
    LOAD_DEFAULT_TDO
}
from '../../actions';

const tdo = combineReducers({
    version: dummy(0),
    boards,
    lists,
    tasks,
    settings: dummy({})
});

export default function(state = {}, action) {
    switch (action.type) {
        case REQUEST_TDO:
            return {
                ...state,
                status: 'loading'
            };

        case RECEIVE_TDO:
            migrate(action.data);
            return action.data;

        case LOAD_DEFAULT_TDO:
            var data = getDefaultData();
            migrate(data);
            return data;

        default:
            return tdo(state, action);
    }
}
