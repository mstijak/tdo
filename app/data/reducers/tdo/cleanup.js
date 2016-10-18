import {dateDiff} from 'cx/util/date/dateDiff';

export function cleanup(data) {

    var now = new Date().getTime();
    var oneDay = 24 * 60 * 60 * 1000; //ms
    var retention = (data.settings.purgeDeletedObjectsAfterDays || 7) * oneDay;
    var completedTaskRetention = (data.settings.completedTasksRetentionDays || 7) * oneDay;

    var boardKeys = {};
    for (var board of data.boards) {
        if (!board.deleted || (board.deletedDate && new Date(board.deletedDate).getTime() - now < retention))
            boardKeys[board.id] = true;
    }
    data.boards = data.boards.filter(b=>boardKeys[b.id]);


    var listKeys = {};
    for (var list of data.lists) {
        if (boardKeys[list.boardId] && !list.deleted || (list.deletedDate && new Date(list.deletedDate).getTime() - now < retention))
            listKeys[list.id] = true;
    }
    data.lists = data.lists.filter(b=>listKeys[b.id]);

    var taskKeys = {};
    for (var task of data.tasks) {
        if (listKeys[task.listId] && !task.deleted || (task.deletedDate && new Date(task.deletedDate).getTime() - now < retention))
            if (!task.completed || !data.settings.deleteCompletedTasks || (task.completedDate && (new Date(task.completedDate).getTime() - now < completedTaskRetention)))
                taskKeys[task.id] = true;
    }
    data.tasks = data.tasks.filter(b=>taskKeys[b.id]);
}
