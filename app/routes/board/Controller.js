import { Controller, FocusManager } from 'cx/ui';
import { append } from 'cx/data';
import { KeyCode, closest } from 'cx/util';

import {removeBoard, gotoAnyBoard} from 'app/data/actions';

import uid from 'uid';
import {firestore} from "../../data/db/firestore";

const mergeFirestoreSnapshot = (prevList, snapshot) => {
    //TODO: Impement a more efficient data merge strategy
    let result = [];
    snapshot.forEach(doc => {
        result.push(doc.data())
    });
    return result;
};

export default class extends Controller {

    onInit() {
        let boardId = this.store.get('$route.boardId');

        this.boardDoc = firestore
            .collection("boards")
            .doc(boardId);

        this.unsubscribeLists = this.boardDoc
            .collection("lists")
            .onSnapshot(snapshot => {
                this.store.update('$page.lists', lists => mergeFirestoreSnapshot(lists, snapshot))
            });

        this.unsubscribeTasks = this.boardDoc
            .collection("tasks")
            .onSnapshot(snapshot => {
                this.store.update('$page.tasks', tasks => mergeFirestoreSnapshot(tasks, snapshot))
            });
    }

    onDestroy() {
        this.unsubscribeLists && this.unsubscribeLists();
        this.unsubscribeTasks && this.unsubscribeTasks();
    }

    addList(e, {store}) {
        if (e)
            e.preventDefault();

        let boardId = store.get('$route.boardId'),
            id = uid();

        this.boardDoc
            .collection('lists')
            .doc(id)
            .set({
                id: uid(),
                name: 'New List',
                edit: true,
                createdDate: new Date().toISOString(),
                boardId: boardId
            });
    }

    deleteList(e, {store}) {

        let id = this.store.get('$list.id');

        this.boardDoc
            .collection('lists')
            .doc(id)
            .update({
                deleted: true,
                deletedDate: new Date().toISOString(),
            });
    }

    prepareTask(listId) {
        return {
            id: uid(),
            listId,
            createdDate: new Date().toISOString(),
            order: Date.now(),
            isNew: true
        }
    }

    addTask(e, {store}) {
        e.preventDefault();
        let listId = store.get('$list.id');
        let task = this.prepareTask(listId);
        this.boardDoc
            .collection('tasks')
            .doc(task.id)
            .set(task);
    }

    moveTaskUp(e, {store}) {
        e.stopPropagation();
        e.preventDefault();
        let {tdo, $task} = store.getData();
        let {tasks} = tdo;
        let index = tasks.indexOf($task);
        let insertPos = -1;
        for (let i = index - 1; i >= 0; i--)
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

        for (let i = index + 1; i < tasks.length; i++)
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

    moveTaskNextBoard(tdo, boardId, store, lists) {
        let ind = tdo.boards.findIndex(a=>a.id == boardId);
        if(ind != -1) {
            // let it loop back to the start
            let nextInd = (ind + 1) % tdo.boards.length;
            boardId = tdo.boards[nextInd].id;
            ind = lists.findIndex(a=>a.boardId == boardId);
            store.set('$task.listId', lists[ind].id);
            History.replaceState({}, null, "~/b/" + boardId);
        }
    }

    moveTaskPrevBoard(tdo, boardId, store, lists) {
        let ind = tdo.boards.findIndex(a=>a.id == boardId);
        if(ind != -1) {
            // let it loop back to the start
            let prevInd = ind - 1;
            if(prevInd < 0) prevInd = tdo.boards.length - 1;
            boardId = tdo.boards[prevInd].id;
            ind = lists.findIndex(a=>a.boardId == boardId);
            store.set('$task.listId', lists[ind].id);
            History.replaceState({}, null, "~/b/" + boardId);
        }
    }

    moveTaskNextList($task, tdo, boardId, store, lists) {
        let listIndex = lists.findIndex(a=>a.id == $task.listId);
        let topHalf = lists.slice(listIndex + 1, lists.length);
        let bottomHalf = lists.slice(0, listIndex);
        let ind = topHalf.findIndex(a=>a.boardId == boardId);
        if(ind != -1) {
            store.set('$task.listId', topHalf[ind].id);
        } else {
            // Wasn't in the top half, move to the bottom half
            // May loop back around
            ind = bottomHalf.findIndex(a=>a.boardId == boardId);
            if(ind != -1) {
                store.set('$task.listId', bottomHalf[ind].id);
            }
        }
    }

    moveTaskPrevList($task, tdo, boardId, store, lists) {
        let listIndex = lists.findIndex(a=>a.id == $task.listId);
        let topHalf = lists.slice(listIndex + 1, lists.length).reverse();
        let bottomHalf = lists.slice(0, listIndex).reverse();
        let ind = bottomHalf.findIndex(a=>a.boardId == boardId);
        if(ind != -1) {
            store.set('$task.listId', bottomHalf[ind].id);
        } else {
            // Wasn't in the bottom half, move to the top half
            ind = topHalf.findIndex(a=>a.boardId == boardId);
            if(ind != -1) {
                store.set('$task.listId', topHalf[ind].id);
            }
        }
    }

    getBoardId($task, lists) {
        let listIndex = lists.findIndex(a=>a.id == $task.listId);
        if(listIndex == -1) return null;
        return lists[listIndex].boardId;
    }

    moveTaskRight(e, {store}) {
        e.stopPropagation();
        e.preventDefault();
        let {tdo, $task} = store.getData();
        let lists = tdo.lists.filter(a => !a.deleted);

        let boardId = this.getBoardId($task, lists);
        if (boardId == null) return;

        if(e.shiftKey) {
            this.moveTaskNextBoard(tdo, boardId, store, lists);
        } else {
            this.moveTaskNextList($task, tdo, boardId, store, lists);
        }

        store.set('activeTaskId', $task.id);
    }

    moveTaskLeft(e, {store}) {
        e.stopPropagation();
        e.preventDefault();
        let {tdo, $task} = store.getData();
        let lists = tdo.lists.filter(a => !a.deleted);

        let boardId = this.getBoardId($task, lists);
        if (boardId == null) return;

        if(e.shiftKey) {
            this.moveTaskPrevBoard(tdo, boardId, store, lists);
        } else {
            this.moveTaskPrevList($task, tdo, boardId, store, lists);
        }

        store.set('activeTaskId', $task.id);
    }

    onTaskKeyDown(e, instance) {
        let t = instance.data.task;
        let {store} = instance;
        let tasks = this.store.get('tdo.tasks');
        let {tdo, $task, $board} = store.getData();

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

                let item = closest(e.target, (el) => el.classList.contains('cxe-menu-item'));
                let elementReceivingFocus = item.nextSibling || item.previousSibling;
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
        let {tdo, $list} = store.getData();
        let {lists} = tdo;
        let index = lists.indexOf($list);
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
        let {tdo, $list} = store.getData();
        let {lists} = tdo;
        let index = lists.indexOf($list);
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
        let {tdo, $board} = store.getData();
        let {boards} = tdo;
        let index = boards.indexOf($board);
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
        let {tdo, $board} = store.getData();
        let {boards} = tdo;
        let index = boards.indexOf($board);
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
        let id = store.get('$board.id');
        store.dispatch(removeBoard(id));
        store.dispatch(gotoAnyBoard(true));
    }
}
