import { GOTO_BOARD, GOTO_ANY_BOARD } from '../actions';

export default store => next => action => {
    switch (action.type) {

        case GOTO_BOARD:
            window.location.hash = '#' + action.id;
            return;

        case GOTO_ANY_BOARD:
            if (action.forced || (window.location.hash || '#') == '#') {
                var {tdo} = store.getState();
                if (tdo.boards.length > 0)
                    window.location.hash = '#' + tdo.boards[0].id;
            }
            return;

        default:
            return next(action);
    }
};