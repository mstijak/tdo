import { append, updateArray } from 'cx/data';
import { ADD_BOARD, REMOVE_BOARD } from '../../../actions';

export default function(state = [], action) {
    switch (action.type) {
        case 'ADD_BOARD':
            return append(state, action.data);

        case 'REMOVE_BOARD':
            return updateArray(state,
                b => ({
                    ...b,
                    deleted: true,
                    deletedDate: new Date().toISOString()
                }),
                b=>b.id == action.id);

        default:
            return state;
    }
}
