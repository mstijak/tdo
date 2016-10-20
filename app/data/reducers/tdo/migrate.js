import uid from 'uid';
import {cleanup} from './cleanup';
import {getTutorial} from './tutorial';

var migrations = [];

//zero
migrations.push(function (data) {});

//add boards
migrations.push(function (data) {

    if (!Array.isArray(data.boards))
        data.boards = [];

    if (!Array.isArray(data.lists))
        data.lists = [];

    if (!Array.isArray(data.tasks))
        data.tasks = [];

    if (data.boards.length == 0) {
        data.boards = [{
            id: uid(),
            name: 'Tasks'
        }];
    }

    data.lists.forEach(l=> {
        if (!l.boardId)
            l.boardId = data.boards[0].id;
    });
});

//settings
migrations.push(function (data) {
    if (!data.settings)
        data.settings = {
            completedTasksRetentionDays: 1,
            deleteCompletedTasks: true,
            deleteCompletedTasksAfterDays: 7,
            purgeDeletedObjectsAfterDays: 3
        };
});

//created => createdDate
migrations.push(function (data) {
    var {boards, lists, tasks} = data;

    for (var array of [boards, lists, tasks]) {
        for (var b of array) {
            if (b.created) {
                b.createdDate = b.created;
                delete b.created;
            }
            if (b.isDeleted) {
                b.deleted = b.isDeleted;
                delete b.isDeleted;
            }
        }
    }
});

//taskStyles
migrations.push(function (data) {
    var {settings} = data;

    if (!Array.isArray(settings.taskStyles))
        settings.taskStyles = [{
            regex: '!important',
            style: 'color: orange'
        }, {
            regex: '#idea',
            style: 'color: yellow'
        }];
});

//add tutorial
migrations.push(function (data) {
    var tutorial = getTutorial();
    data.boards = [...data.boards, ...tutorial.boards];
    data.lists = [...data.lists, ...tutorial.lists];
    data.tasks = [...data.tasks, ...tutorial.tasks];
});


export function migrate(data) {
    var version = data.version || 0;

    for (var v = version + 1; v < migrations.length; v++) {
        migrations[v](data);
        data.version = v;
    }

    cleanup(data);
}
