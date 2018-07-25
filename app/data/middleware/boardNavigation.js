import { GOTO_BOARD, GOTO_ANY_BOARD } from '../actions';
import {History} from "cx/ui";

export default store => next => action => {
    switch (action.type) {

        case GOTO_BOARD:
            History.pushState({}, null, `~/b/${action.id}`);
            return;

        case GOTO_ANY_BOARD:
            if (action.forced || (window.location.hash || '#') == '#') {
                const {tdo} = store.getState();
                if (tdo.boards.length > 0)
                    History.pushState({}, null, `~/b/${tdo.boards[0].id}`);
            }
            return;

        default:
            return next(action);
    }
};