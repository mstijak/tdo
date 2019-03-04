import { FocusManager, batchUpdatesAndNotify } from "cx/ui";
import { ArrayRef, updateArray } from "cx/data";
import { KeyCode, closest, getSearchQueryPredicate } from "cx/util";

import uid from "uid";
import { firestore } from "../../data/db/firestore";

const mergeFirestoreSnapshot = (prevList, snapshot, name) => {
    //TODO: Impement a more efficient data merge strategy
    let result = [];
    snapshot.forEach(doc => {
        result.push(doc.data());
    });
    //console.log(name, result);
    return result;
};

const OneDayMs = 24 * 60 * 60 * 1000;

export default ({ ref, get, set }) => {

    const lists = ref("$page.lists").as(ArrayRef);
    const tasks = ref("$page.tasks").as(ArrayRef);
    const boardId = get("$route.boardId");
    const boardDoc = firestore.collection("boards").doc(boardId);
    const unsubscribeLists = boardDoc
        .collection("lists")
        .onSnapshot(snapshot => {
            lists.update(lists => mergeFirestoreSnapshot(lists, snapshot, "LISTS"));
        });

    const unsubscribeTasks = boardDoc
        .collection("tasks")
        .onSnapshot(snapshot => {
            tasks.update(tasks => mergeFirestoreSnapshot(tasks, snapshot, "TASKS"));
        });

    const updateTask = (task) => {
        tasks.update(
            updateArray,
            t => ({ ...t, ...task }),
            t => t.id === task.id
        );

        boardDoc
            .collection("tasks")
            .doc(task.id)
            .update(task);
    }

    const updateList = (list) => {
        lists.update(
            updateArray,
            t => ({ ...t, ...list }),
            t => t.id === list.id
        );

        boardDoc
            .collection("lists")
            .doc(list.id)
            .update(list);
    }

    const prepareTask = (listId) => {
        let order = getSortedTaskOrderList(listId);
        let maxOrder = order[order.length - 1] || 0;
        let id = uid();
        set("newTaskId", id);
        return {
            id,
            listId,
            createdDate: new Date().toISOString(),
            order: maxOrder + 1,
            deleted: false
        };

    };

    const getSortedTaskOrderList = (listId) => {
        return getOrderList(tasks.get(), t => t.listId == listId);
    };
    const getSortedListOrderList = (boardId) => {
        return getOrderList(lists.get(), t => t.boardId == boardId);
    };

    const moveTaskToList = (taskId, listId) => {
        let order = getSortedTaskOrderList(listId);
        let taskOrder = (order[order.length - 1] || 0) + 1;
        set("activeTaskId", taskId);
        return updateTask({
            id: taskId,
            listId,
            order: taskOrder
        });
    };

    const hardDeleteTask = (task) => {
        boardDoc
            .collection("tasks")
            .doc(task.id)
            .delete();
    }

    return {
        onInit() {
            this.addTrigger('maintenance', [tasks, 'settings'], (tasks, settings) => {
                if (!settings || !tasks)
                    return;

                for (let task of tasks) {
                    if (task.deleted && Date.now() - task.deletedDate > settings.purgeDeletedObjectsAfterDays * OneDayMs)
                        hardDeleteTask(task);
                    else if (settings.deleteCompletedTasks && task.completed && Date.now() - task.completedDate > settings.deleteCompletedTasksAfterDays * OneDayMs)
                        hardDeleteTask(task);
                }
            });
        },

        onDestroy() {
            unsubscribeLists && unsubscribeLists();
            unsubscribeTasks && unsubscribeTasks();
        },

        addList(e) {
            if (e) e.preventDefault();
            let id = uid();
            let order = getSortedListOrderList(boardId);
            let maxOrder = order[order.length - 1] || 0;
            boardDoc
                .collection("lists")
                .doc(id)
                .set({
                    id: id,
                    name: "New List",
                    edit: true,
                    createdDate: new Date().toISOString(),
                    boardId: boardId,
                    order: maxOrder + 1
                });
        },

        onSaveList(e, { store }) {
            let list = store.get("$list");
            boardDoc
                .collection("lists")
                .doc(list.id)
                .set({
                    ...list,
                    edit: false,
                    lastChangeDate: new Date().toISOString()
                });
        },

        deleteList(e, { store }) {
            let id = store.get("$list.id");
            updateList({
                id,
                deleted: true,
                deletedDate: new Date().toISOString()
            });
        },

        onSaveTask(task) {
            updateTask(task);
        },

        addTask(e, { store }) {
            e.preventDefault();
            let listId = store.get("$list.id");
            let task = prepareTask(listId);
            tasks.append(task);
            boardDoc
                .collection("tasks")
                .doc(task.id)
                .set(task);
        },

        moveTaskUp(e, { store }) {
            e.stopPropagation();
            e.preventDefault();
            let { $task } = store.getData();
            let oldTask = findUpperTask(store, $task);
            if (oldTask) {
                this.replaceTaskOrders(oldTask, $task)
            }
        },

        replaceTaskOrders(firstTask, secondTask) {
            updateTask({
                ...secondTask,
                order: firstTask.order
            });
            updateTask({
                ...firstTask,
                order: secondTask.order
            });
        },

        moveTaskDown(e, { store }) {
            e.stopPropagation();
            e.preventDefault();
            let { $task } = store.getData();
            let oldTask = findUnderlyingTask(store, $task);
            if (oldTask) {
                this.replaceTaskOrders(oldTask, $task)
            }
        },

        moveTaskRight(e, { store }) {
            e.stopPropagation();
            e.preventDefault();
            let { $page, $task } = store.getData();
            let lists = $page.lists.filter(a => !a.deleted);
            lists.sort((a, b) => a.order - b.order);
            let listIndex = lists.findIndex(a => a.id == $task.listId);
            if (listIndex + 1 < lists.length)
                moveTaskToList($task.id, lists[listIndex + 1].id);
        },

        moveTask(e, { store }) {
            let sourceIndex = e.source.store.get("$index");
            let selectedTask = this.store.get("$page.tasks")[sourceIndex];
            let targetIndex = store.get("$index");
            let newTask = this.store.get("$page.tasks")[targetIndex];
            if (newTask.listId == selectedTask.listId) {
                if (selectedTask.order < newTask.order) {
                    this.updateLowerTaskList(selectedTask, newTask);
                } else {
                    this.updateUpperTaskList(selectedTask, newTask)
                }
            } else {
                let order = getSortedTaskOrderList(newTask.listId);
                let taskOrder = (order[order.length - 1] || 0) + 1;
                updateTask({
                    id: selectedTask.id,
                    listId: newTask.listId,
                    order: taskOrder
                });
            }
        },

        updateLowerTaskList(selectedTask, newTask) {
            let tasks = getTasksFromList(this.store, selectedTask.listId)
            tasks.forEach(e => {
                if (e.order > newTask.order) {
                    updateTask({
                        ...e,
                        order: e.order + 1
                    });
                }
            });
            updateTask({
                ...selectedTask,
                order: newTask.order + 1
            });
        },

        updateUpperTaskList(selectedTask, newTask) {
            let tasks = getTasksFromList(this.store, selectedTask.listId)
            tasks.forEach(e => {
                if (e.order >= newTask.order) {
                    updateTask({
                        ...e,
                        order: e.order + 1
                    });
                }
            });
            updateTask({
                ...selectedTask,
                order: newTask.order
            });

        },

        moveTaskLeft(e, { store }) {
            e.stopPropagation();
            e.preventDefault();
            let { $page, $task } = store.getData();
            let lists = $page.lists.filter(a => !a.deleted);
            lists.sort((a, b) => a.order - b.order);
            let listIndex = lists.findIndex(a => a.id == $task.listId);
            if (listIndex > 0) moveTaskToList($task.id, lists[listIndex - 1].id);
        },

        insertTaskAtCertainPoint(e, instance) {
            e.stopPropagation();
            e.preventDefault();
            let { store, data } = instance;
            let t = data.task;
            let { $task } = store.getData();

            let task = prepareTask(t.listId);
            task.order = $task.order + 1;
            let tasksFromList = getTasksFromList(this.store, t.listId)
            tasksFromList.forEach(e => {
                if (e.order > $task.order) {
                    updateTask({
                        ...e,
                        order: e.order + 1
                    });
                }
            });
            tasks.append(task);
            boardDoc
                .collection("tasks")
                .doc(task.id)
                .set(task);
        },

        onTaskKeyDown(e, instance) {
            let { store, data } = instance;
            let t = data.task;
            let { $task } = store.getData();
            let code = c => c.charCodeAt(0);

            switch (e.keyCode) {
                case KeyCode.delete:
                case code("D"):
                    if (e.keyCode === code("D") && !e.shiftKey) return;

                    let item = closest(e.target, el =>
                        el.classList.contains("cxe-menu-item")
                    );
                    let elementReceivingFocus = item.nextElementSibling || item.previousElementSibling;

                    batchUpdatesAndNotify(() => {
                        updateTask({
                            id: $task.id,
                            deleted: true,
                            deletedDate: new Date().toISOString()
                        });
                    }, () => {
                        if (elementReceivingFocus)
                            FocusManager.focusFirst(elementReceivingFocus);
                    });

                    break;

                case KeyCode.insert:
                case code("O"):
                    if (e.ctrlKey) this.insertTaskAtCertainPoint(e, instance);

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
        },

        replaceLists(e, { store }) {
            let targetIndex = store.get("$index");
            let sourceIndex = e.source.store.get("$index");

            store.update("$page.lists", widgets => {
                let secondList = widgets[sourceIndex];
                let firstList = widgets[targetIndex];
                this.swapLists(secondList, firstList)
            }
            );
        },

        onTaskListKeyDown(e, instance) {
            let code = c => c.charCodeAt(0),
                list;

            switch (e.keyCode) {
                case code("K"):
                    if (e.currentTarget.previousSibling)
                        FocusManager.focusFirst(e.currentTarget.previousSibling);
                    break;

                case code("J"):
                    if (e.currentTarget.nextSibling)
                        FocusManager.focusFirst(e.currentTarget.nextSibling);
                    break;

                case KeyCode.left:
                case code("H"):
                    list = closest(e.target, el => el.classList.contains("cxb-tasklist"));
                    if (list.previousSibling) FocusManager.focusFirst(list.previousSibling);
                    break;

                case KeyCode.right:
                case code("L"):
                    list = closest(e.target, el => el.classList.contains("cxb-tasklist"));
                    if (list.nextSibling) FocusManager.focusFirst(list.nextSibling);
                    break;
            }
        },

        listMoveLeft(e, { store }) {
            let { $list } = store.getData();
            let listOrder = getOrderList(lists.get());
            let index = listOrder.indexOf($list.order);
            if (index > 0) {
                let leftList = getListByOrder(listOrder[index - 1], lists.get(), $list.boardId)
                this.swapLists(leftList, $list)
            }
        },

        swapLists(firstList, secondList) {
            updateList({
                id: firstList.id,
                order: secondList.order
            });
            updateList({
                id: secondList.id,
                order: firstList.order
            });
        },

        listMoveRight(e, { store }) {
            let { $list } = store.getData();
            let listOrder = getOrderList(lists.get());
            let index = listOrder.indexOf($list.order);
            if (index < listOrder.length) {
                let rightList = getListByOrder(listOrder[index + 1], lists.get(), $list.boardId)
                this.swapLists(rightList, $list)
            }
        },

        boardMoveLeft(e, { store }) {
            let { boards, $board } = store.getData();
            let orderList = getOrderList(boards);
            let index = orderList.indexOf($board.order)

            if (index != 0) {
                this.swapBoards(store, $board, boards, orderList, index, index - 1);
            }
        },


        boardMoveRight(e, { store }) {
            let { boards, $board } = store.getData();
            let orderList = getOrderList(boards);
            let index = orderList.indexOf($board.order)

            if ((index + 1) < orderList.length) {
                this.swapBoards(store, $board, boards, orderList, index, index + 1);
            }
        },

        swapBoards(store, board, boards, orderList, firstIndex, secondIndex) {
            let userId = store.get("user.id");
            let leftOrder = orderList[secondIndex];
            let leftBoard = boards.filter(e => e.order == leftOrder)[0];

            firestore
                .collection("users")
                .doc(userId)
                .collection("boards")
                .doc(board.id)
                .update({
                    id: board.id,
                    order: orderList[secondIndex] || 0
                });

            firestore
                .collection("users")
                .doc(userId)
                .collection("boards")
                .doc(leftBoard.id)
                .update({
                    id: leftBoard.id,
                    order: orderList[firstIndex] || 0
                });
        },

        deleteBoard(e, { store }) {
            let board = store.get("$board");
            let userId = store.get("user.id");
            firestore
                .collection("users")
                .doc(userId)
                .collection("boards")
                .doc(board.id).update({
                    id: board.id,
                    deleted: true,
                    deletedDate: new Date().toISOString()
                });
        },

        saveBoard(e, { store }) {
            let board = store.get("$board");
            let userId = store.get("user.id");

            firestore
                .collection("users")
                .doc(userId)
                .collection("boards")
                .doc(board.id)
                .set({
                    ...board,
                    edit: false,
                    lastChangeDate: new Date().toISOString()
                });
        }
    }
}

function getTasksFromList(store, listId) {
    let tasks = store.get("$page.tasks");
    return tasks.filter(item => !item.deleted && item.listId == listId);
}

function getOrderList(items, filter = () => true) {
    let list = items.filter(item => !item.deleted && filter(item)).map(a => a.order);
    list.sort();
    return list;
}

function findUpperTask(store, task) {
    let tasks = getTasksFromList(store, task.listId)
    let max = Number.MAX_VALUE;
    var oldTask;
    tasks.forEach(e => {
        if (e.id != task.id && task.order - e.order < max && task.order > e.order) {
            max = task.order - e.order;
            oldTask = e;
        }
    });
    return oldTask;
}

function getListByOrder(order, list, boardId) {
    return list.filter(e => boardId == e.boardId && e.order == order)[0];
}
function findUnderlyingTask(store, task) {
    let tasks = getTasksFromList(store, task.listId)
    let max = Number.MAX_VALUE;
    var oldTask;
    tasks.forEach(e => {
        if (e.id != task.id && e.order - task.order < max && task.order < e.order) {
            max = e.order - task.order;
            oldTask = e;
        }
    });
    return oldTask;
}