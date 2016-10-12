import uid from 'uid';

var migrations = [];

//add boards
migrations.push(function (data) {
    if (!Array.isArray(data.boards)) {
        data.boards = [{
            id: uid(),
            name: 'Tasks'
        }];
    }

    data.lists.forEach(l=> {
        if (!l.boardId)
            l.boardId = data.boards[0].id;
    });

    return data;
});


export function migrate(data) {
    var version = data.version || 0;

    for (var v = version; v < migrations.length; v++) {
        data = migrations[v](data);
        data.version = v;
    }

    return data;
}
