import {combineReducers} from 'redux';
import tdo from './tdo';

import dummy from './dummyReducer';

export default combineReducers({
    tdo,
    hash: dummy('#'),
    search: dummy({}),
    pages: dummy({}),
    layout: dummy({})
});


