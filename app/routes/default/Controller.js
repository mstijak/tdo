import {Controller} from 'cx/ui/Controller';
import {append} from 'cx/data/ops/append';
import {KeyCode} from 'cx/util/KeyCode';
import {Gists} from '../../services/Gists';
import {FocusManager} from 'cx/ui/FocusManager';
import {migrate} from '../../data/migrate';

import uid from 'uid';

export default class extends Controller {
    init() {
        super.init();

        if (!this.store.get('tdo'))
            this.load();

        this.addTrigger('persist', ['tdo'], ::this.persist);
    }

    persist() {
        var {tdo} = this.store.getData();

        var gh = localStorage.gh && JSON.parse(localStorage.gh);

        if (gh && gh.token && gh.gistId) {
            if (this.saveTaskId)
                clearTimeout(this.saveTaskId);
            this.saveTaskId = setTimeout(()=> {
                delete this.saveTaskId;
                let gists = new Gists(gh);
                gists.update(tdo);
            }, 5000);
        }
        else {
            localStorage.tdo = JSON.stringify(tdo);
        }
    }

    gotoFirstBoard() {
        var boards = this.store.get('tdo.boards');
        if (boards.length > 0)
            window.location.hash = '#' + boards[0].id;
    }

    load() {
        var gh = localStorage.gh && JSON.parse(localStorage.gh);
        if (gh && gh.token && gh.gistId) {
            let gists = new Gists(gh);
            this.store.set('$page.status', 'loading');
            gists.load()
                .then(x=> {
                    migrate(x);
                    this.store.set('tdo', x);
                    this.store.set('$page.status', 'ok');
                    this.gotoFirstBoard();
                })
                .catch(e=> {
                    console.log(e);
                    this.store.set('$page.status', 'error');
                });
        }
        else {
            let data = localStorage.tdo && JSON.parse(localStorage.tdo) || this.getDefaultData();
            migrate(data);
            this.store.set('tdo', data);
            this.gotoFirstBoard();
            if (this.store.get('tdo.lists').length == 0)
                this.addList(null, {store: this.store});
        }
    }

    getDefaultData() {
        return {
            lists: [],
            tasks: []
        }
    }

    addList(e, {store}) {
        if (e)
            e.preventDefault();

        var boardId = store.get('$board.id') || store.get('tdo.boards')[0].id;

        this.store.update('tdo.lists', append, {
            id: uid(),
            name: 'New List',
            edit: true,
            createdDate: new Date().toISOString(),
            boardId: boardId
        });
    }

    deleteList(e, {store}) {
        store.update('$list', list => ({
            ...list,
            deleted: true,
            deletedDate: new Date().toISOString(),
        }));
    }

    prepareTask(listId) {
        return {
            id: uid(),
            listId,
            createdDate: new Date().toISOString(),
            isNew: true
        }
    }

    addTask(e, {store}) {
        var listId = store.get('$list.id');
        this.store.update('tdo.tasks', append, this.prepareTask(listId));
        e.preventDefault();
    }

    moveTaskUp(e, {store}) {
        e.stopPropagation();
        e.preventDefault();
        let {tdo, $task} = store.getData();
        let {tasks} = tdo;
        let index = tasks.indexOf($task);
        let insertPos = -1;
        for (var i = index - 1; i >= 0; i--)
            if (tasks[i].listId == $task.listId) {
                insertPos = i;
                break;
            }
        if (insertPos != -1) {
            this.store.set('tdo.tasks', [
                ...tasks.slice(0, insertPos),
                $task,
                ...tasks.slice(insertPos, index),
                ...tasks.slice(index + 1)
            ]);
        }
    }

    moveTaskDown(e, {store}) {
        e.stopPropagation();
        e.preventDefault();
        let {tdo, $task} = store.getData();
        let {tasks} = tdo;
        let index = tasks.indexOf($task);
        let insertPos = -1;

        for (var i = index + 1; i < tasks.length; i++)
            if (tasks[i].listId == $task.listId) {
                insertPos = i;
                break;
            }

        if (insertPos != -1) {
            this.store.set('tdo.tasks', [
                ...tasks.slice(0, index),
                ...tasks.slice(index + 1, insertPos + 1),
                $task,
                ...tasks.slice(insertPos + 1)
            ]);
        }
    }

    moveTaskRight(e, {store}) {
        e.stopPropagation();
        e.preventDefault();
        let {tdo, $task} = store.getData();
        let {lists} = tdo;
        var listIndex = lists.findIndex(a=>a.id == $task.listId);
        if (listIndex != -1 && listIndex + 1 < lists.length) {
            store.set('$task.listId', lists[listIndex + 1].id);
            store.set('activeTaskId', $task.id);
        }
    }

    moveTaskLeft(e, {store}) {
        e.stopPropagation();
        e.preventDefault();
        let {tdo, $task} = store.getData();
        let {lists} = tdo;
        var listIndex = lists.findIndex(a=>a.id == $task.listId);
        if (listIndex > 0) {
            store.set('$task.listId', lists[listIndex - 1].id);
            store.set('activeTaskId', $task.id);
        }
    }

    onTaskKeyDown(e, instance) {
        let t = instance.data.task;
        let {store} = instance;
        let tasks = this.store.get('tdo.tasks');

        switch (e.keyCode) {
            case KeyCode.delete:
                store.update('$task', task => ({
                    ...task,
                    deleted: true,
                    deletedDate: new Date().toISOString()
                }));
                break;

            case KeyCode.insert:
                let index = tasks.indexOf(t);
                let nt = this.prepareTask(t.listId);
                this.store.set('activeTaskId', nt.id);
                this.store.set('tdo.tasks', [...tasks.slice(0, index), nt, ...tasks.slice(index)]);
                break;

            case KeyCode.up:
                if (e.ctrlKey) this.moveTaskUp(e, instance);
                break;

            case KeyCode.down:
                if (e.ctrlKey) this.moveTaskDown(e, instance);
                break;

            case KeyCode.right:
                if (e.ctrlKey) this.moveTaskRight(e, instance);
                break;

            case KeyCode.left:
                if (e.ctrlKey) this.moveTaskLeft(e, instance);
                break;
        }
    }

    onTaskListKeyDown(e, instance) {
        switch (e.keyCode) {
            case KeyCode.left:
                if (e.currentTarget.previousSibling)
                    FocusManager.focusFirst(e.currentTarget.previousSibling);
                break;

            case KeyCode.right:
                if (e.currentTarget.nextSibling)
                    FocusManager.focusFirst(e.currentTarget.nextSibling);
                break;
        }
    }

    listMoveLeft(e, {store}) {
        var {tdo, $list} = store.getData();
        var {lists} = tdo;
        var index = lists.indexOf($list);
        if (index > 0) {
            store.set('tdo.lists', [
                ...lists.slice(0, index - 1),
                $list,
                lists[index - 1],
                ...lists.slice(index + 1)
            ]);
        }
    }

    listMoveRight(e, {store}) {
        var {tdo, $list} = store.getData();
        var {lists} = tdo;
        var index = lists.indexOf($list);
        if (index + 1 < lists.length) {
            store.set('tdo.lists', [
                ...lists.slice(0, index),
                lists[index + 1],
                $list,
                ...lists.slice(index + 2)
            ]);
        }
    }

    boardMoveLeft(e, {store}) {
        var {tdo, $board} = store.getData();
        var {boards} = tdo;
        var index = boards.indexOf($board);
        if (index > 0) {
            store.set('tdo.boards', [
                ...boards.slice(0, index - 1),
                $board,
                boards[index - 1],
                ...boards.slice(index + 1)
            ]);
        }
    }

    boardMoveRight(e, {store}) {
        var {tdo, $board} = store.getData();
        var {boards} = tdo;
        var index = boards.indexOf($board);
        if (index + 1 < boards.length) {
            store.set('tdo.boards', [
                ...boards.slice(0, index),
                boards[index + 1],
                $board,
                ...boards.slice(index + 2)
            ]);
        }
    }

    deleteBoard(e, {store}) {
        store.update('$board', board => ({
            ...board,
            deleted: true,
            deletedDate: new Date().toISOString()
        }));
    }
}
