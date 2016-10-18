import uid from 'uid';

export const ADD_BOARD = 'ADD_BOARD';
export const REMOVE_BOARD = 'REMOVE_BOARD';

export const GOTO_BOARD = 'GOTO_BOARD';
export const GOTO_ANY_BOARD = 'SELECT_FIRST_BOARD';

export const gotoBoard = id => ({
    type: GOTO_BOARD,
    id: id
});

export const gotoAnyBoard = (forced) => ({
    type: GOTO_ANY_BOARD,
    forced: forced
});

export const addBoard = (board = {}) => dispatch => {
    if (!board)
        board.id = uid();

    board.createdDate = new Date().toISOString();

    dispatch({
        type: ADD_BOARD,
        data: board
    });
};

export const removeBoard = id => ({
    type: REMOVE_BOARD,
    id: id
});
