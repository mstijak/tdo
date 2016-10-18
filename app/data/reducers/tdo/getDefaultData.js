import uid from "uid";

export function getDefaultData() {
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
