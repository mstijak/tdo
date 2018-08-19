import {Controller, FocusManager} from 'cx/ui';
import {append, updateArray} from 'cx/data';
import {KeyCode, closest, isNonEmptyArray} from 'cx/util';

import {removeBoard, gotoAnyBoard} from 'app/data/actions';

import uid from 'uid';
import {firestore} from "../../data/db/firestore";

const mergeFirestoreSnapshot = (prevList, snapshot, name) => {
    //TODO: Impement a more efficient data merge strategy
    let result = [];
    snapshot.forEach(doc => {
        result.push(doc.data())
    });
    console.log(name, result);
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
                                        this.store.update('$page.lists', lists => mergeFirestoreSnapshot(lists, snapshot, "LISTS"))
                                    });

        this.unsubscribeTasks = this.boardDoc
                                    .collection("tasks")
                                    .onSnapshot(snapshot => {
                                        this.store.update('$page.tasks', tasks => mergeFirestoreSnapshot(tasks, snapshot, "TASKS"))
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
                id: id,
                name: 'New List',
                edit: true,
                createdDate: new Date().toISOString(),
                boardId: boardId
            });
    }

    onSaveList(e, {store}) {
        //store.delete('$list.edit')
        let list = store.get('$list');
        console.log("SAVE LIST", list);
        this.boardDoc
            .collection('lists')
            .doc(list.id)
            .set({
                ...list,
                edit: false
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
        let order = this.getSortedTaskOrderList(listId);
        let maxOrder = order[order.length - 1] || 0;
        return {
            id: uid(),
            listId,
            createdDate: new Date().toISOString(),
            order: maxOrder + 1,
            isNew: true
        }
    }

    onSaveTask(task) {

        this.store.update(
            '$page.tasks',
            updateArray,
            _ => task,
            t => t.id == task.id
        );

        this.boardDoc
            .collection('tasks')
            .doc(task.id)
            .set(task);
    }

    getSortedTaskOrderList(listId) {
        let tasks = this.store.get('$page.tasks');
        let order = tasks
            .filter(t => !t.deleted && t.listId == listId)
            .map(t => t.order);
        order.sort();
        return order;
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
        let {$task} = store.getData();
        let order = this.getSortedTaskOrderList($task.listId);
        let index = order.findIndex(o => o === $task.order);
        if (index < 1)
            return;
        let newOrder = index >= 2 ? (order[index - 2] + order[index - 1]) / 2 : order[0] - 1;
        this.onSaveTask({
            ...$task,
            order: newOrder
        });
    }

    moveTaskDown(e, {store}) {
        e.stopPropagation();
        e.preventDefault();
        let {$task} = store.getData();
        let order = this.getSortedTaskOrderList($task.listId);
        let index = order.findIndex(o => o === $task.order);
        if (index == -1 || index >= order.length - 1)
            return;
        let newOrder = index + 2 < order.length ? (order[index + 2] + order[index + 1]) / 2 : order[index + 1] + 1;
        this.onSaveTask({
            ...$task,
            order: newOrder
        });
    }

    moveTaskNextList($task, tdo, boardId, store, lists) {
        let listIndex = lists.findIndex(a => a.id == $task.listId);
        let topHalf = lists.slice(listIndex + 1, lists.length);
        let bottomHalf = lists.slice(0, listIndex);
        let ind = topHalf.findIndex(a => a.boardId == boardId);
        if (ind != -1) {
            store.set('$task.listId', topHalf[ind].id);
        } else {
            // Wasn't in the top half, move to the bottom half
            // May loop back around
            ind = bottomHalf.findIndex(a => a.boardId == boardId);
            if (ind != -1) {
                store.set('$task.listId', bottomHalf[ind].id);
            }
        }
    }

    moveTaskPrevList($task, tdo, boardId, store, lists) {
        let listIndex = lists.findIndex(a => a.id == $task.listId);
        let topHalf = lists.slice(listIndex + 1, lists.length).reverse();
        let bottomHalf = lists.slice(0, listIndex).reverse();
        let ind = bottomHalf.findIndex(a => a.boardId == boardId);
        if (ind != -1) {
            store.set('$task.listId', bottomHalf[ind].id);
        } else {
            // Wasn't in the bottom half, move to the top half
            ind = topHalf.findIndex(a => a.boardId == boardId);
            if (ind != -1) {
                store.set('$task.listId', topHalf[ind].id);
            }
        }
    }

    getBoardId($task, lists) {
        let listIndex = lists.findIndex(a => a.id == $task.listId);
        if (listIndex == -1) return null;
        return lists[listIndex].boardId;
    }

    moveTaskRight(e, {store}) {
        e.stopPropagation();
        e.preventDefault();
        let {tdo, $task} = store.getData();
        let lists = tdo.lists.filter(a => !a.deleted);

        let boardId = this.getBoardId($task, lists);
        if (boardId == null) return;

        if (e.shiftKey) {
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

        if (e.shiftKey) {
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

                this.onSaveTask(store.get('$task'));

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
        this.boardDoc.update({
            deleted: true,
            deletedDate: new Date().toISOString()
        });
    }

    saveBoard(e, {store}) {
        let board = store.get('$board');
        let userId = store.get('user.id');

        firestore
            .collection('users')
            .doc(userId)
            .collection('boards')
            .doc(board.id)
            .set({
                ...board,
                edit: false
            })
    }
}
