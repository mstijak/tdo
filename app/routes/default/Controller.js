import {Controller} from 'cx/ui/Controller';
import {append} from 'cx/data/ops/append';
import {KeyCode} from 'cx/util/KeyCode';
import {FocusManager} from 'cx/ui/FocusManager';
import {removeBoard, gotoAnyBoard} from 'app/data/actions';
import {closest} from 'cx/util/DOM';
import uid from 'uid';

export default class extends Controller {

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

        let code = (c) => c.charCodeAt(0);
        switch (e.keyCode) {
            case KeyCode.delete:
            case code('D'):
                if (e.keyCode === code('D') && !e.shiftKey)
                    return;

                store.update('$task', task => ({
                    ...task,
                    deleted: true,
                    deletedDate: new Date().toISOString()
                }));

                var item = closest(e.target, (el) => el.classList.contains('cxe-menu-item'));
                var elementReceivingFocus = item.nextSibling || item.previousSibling;
                if (elementReceivingFocus)
                    FocusManager.focusFirst(elementReceivingFocus);

                break;

            case KeyCode.insert:
            case code('O'):
                let nt = this.prepareTask(t.listId);
                this.store.set('activeTaskId', nt.id);
                let index = tasks.indexOf(t)
                if (index < tasks.length - 1 && e.keyCode === code('O') && !e.shiftKey)
                    index++; // Create task below

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
        let code = (c) => c.charCodeAt(0),
            list;

        switch (e.keyCode) {
            case code('K'):
                if (e.currentTarget.previousSibling)
                    FocusManager.focusFirst(e.currentTarget.previousSibling);
                break;

            case code('J'):
                if (e.currentTarget.nextSibling)
                    FocusManager.focusFirst(e.currentTarget.nextSibling);
                break;

            case KeyCode.left:
            case code('H'):
                list = closest(e.target, (el) => el.classList.contains('cxb-tasklist'));
                if (list.previousSibling)
                    FocusManager.focusFirst(list.previousSibling);
                break;

            case KeyCode.right:
            case code('L'):
                list = closest(e.target, (el) => el.classList.contains('cxb-tasklist'));
                if (list.nextSibling)
                    FocusManager.focusFirst(list.nextSibling);
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
        var id = store.get('$board.id');
        store.dispatch(removeBoard(id));
        store.dispatch(gotoAnyBoard(true));
    }
}
