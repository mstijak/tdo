import { dateDiff } from 'cx/util';

function defaultValue(value, def) {
    if (typeof value == "number")
        return value;
    return def;
}

export function cleanup(data) {

    var now = new Date().getTime();
    var oneDay = 24 * 60 * 60 * 1000; //ms
    var retention = defaultValue(data.settings.purgeDeletedObjectsAfterDays, 7) * oneDay;
    var completedTaskRetention = defaultValue(data.settings.deleteCompletedTasksAfterDays, 7) * oneDay;

    var boardKeys = {};
    for (var board of data.boards) {
        if (!board.deleted || (board.deletedDate && Date.parse(board.deletedDate) + retention > now))
            boardKeys[board.id] = true;
    }
    data.boards = data.boards.filter(b=>boardKeys[b.id]);


    var listKeys = {};
    for (var list of data.lists) {
        if (boardKeys[list.boardId] && !list.deleted || (list.deletedDate && Date.parse(list.deletedDate) + retention > now))
            listKeys[list.id] = true;
    }
    data.lists = data.lists.filter(b=>listKeys[b.id]);

    var taskKeys = {};
    for (var task of data.tasks) {
        if (listKeys[task.listId] && !task.deleted || (task.deletedDate && Date.parse(task.deletedDate) + retention < now))
            if (!task.completed || !data.settings.deleteCompletedTasks || (task.completedDate && (Date.parse(task.completedDate) + completedTaskRetention > now)))
                taskKeys[task.id] = true;
    }
    data.tasks = data.tasks.filter(b=>taskKeys[b.id]);
}
