export const REQUEST_TDO = 'REQUEST_TDO';
export const RECEIVE_TDO = 'RECEIVE_TDO';
export const LOAD_DEFAULT_TDO = 'LOAD_DEFAULT_TDO';

export const loadDefault = () => ({
    type: LOAD_DEFAULT_TDO
});

import { Gists } from '../services/Gists';
import { GHAuth } from '../services/GHAuth';

import { gotoAnyBoard } from './board';

export const loadData = () => dispatch => {
    var storage = GHAuth.get();
    if (storage && storage.token && storage.gistId) {
        dispatch({
            type: REQUEST_TDO
        });
        let gists = new Gists(storage);
        return gists.load()
            .then(x=> {
                dispatch({
                    type: RECEIVE_TDO,
                    data: x
                });
                dispatch(gotoAnyBoard())
            });
    }
    else {
        let data = localStorage.tdo && JSON.parse(localStorage.tdo);
        if (data) {
            dispatch({
                type: RECEIVE_TDO,
                data: data
            });
        }
        else {
            dispatch(loadDefault());
        }
        dispatch(gotoAnyBoard());
    }
};

export * from './board';