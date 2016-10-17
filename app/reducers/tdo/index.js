import {migrate} from '../../data/migrate';

export const REQUEST_TDO = 'REQUEST_TDO'
export const RECEIVE_TDO = 'RECEIVE_TDO'
export const LOAD_DEFAULT_TDO = 'LOAD_DEFAULT_TDO'

function getDefaultData() {
    var board = {
        id: uid(),
        name: 'Tasks',
        createdDate: new Date().toISOString()
    };

    var list = {
        id: uid(),
        boardId: board.id,
        name: 'List 1',
        createdDate: new Date().toISOString()
    };

    return {
        boards: [board],
        lists: [list],
        tasks: []
    }
}


export default function(state = {}, action) {
    switch (action.type) {
        case REQUEST_TDO:
            return {
                ...state,
                status: 'loading'
            };

        case RECEIVE_TDO:
            return migrate(action.data);

        case LOAD_DEFAULT_TDO:
            return migrate(getDefaultData());

        default:
            return state;
    }
}
