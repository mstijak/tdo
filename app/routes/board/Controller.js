import {FocusManager, batchUpdatesAndNotify} from "cx/ui";
import {ArrayRef, updateArray} from "cx/data";
import {KeyCode, closest, getSearchQueryPredicate} from "cx/util";

import uid from "uid";
import {firestore} from "../../data/db/firestore";
import {ShallowIndex} from "../../data/ShallowIndex";

const OneDayMs = 24 * 60 * 60 * 1000;

export default ({store, ref, get, set}) => {

    const lists = ref("$page.lists").as(ArrayRef);
    const tasks = ref("$page.tasks").as(ArrayRef);
    const boardId = get("$route.boardId");
    const boardDoc = firestore.collection("boards").doc(boardId);

    const taskIndex = new ShallowIndex();
    const listIndex = new ShallowIndex();

    let maintenancePerformed = false;

    const unsubscribeLists = boardDoc
        .collection("lists")
        .onSnapshot(snapshot => {
            let dirty = false;
            snapshot.forEach(doc => {
                dirty |= listIndex.index(doc.data());
            });
            if (dirty)
                refreshLists();
        });

    const unsubscribeTasks = boardDoc
        .collection("tasks")
        .onSnapshot(snapshot => {
            let dirty = false;
            snapshot.forEach(doc => {
                let task = doc.data();
                dirty |= taskIndex.index(task);
            });

            if (dirty)
                refreshTasks();

            if (!maintenancePerformed) {
                maintenancePerformed = true;
                setTimeout(maintenance, 1);
            }
        });

    const refreshTasks = () => {
        let searchTerms = null;
        let search = get('search');

        if (search && search.query)
            searchTerms = search.query.split(' ').filter(Boolean).map(w => new RegExp(w, 'gi'));

        tasks.set(taskIndex.filter(t => {
            if (t.deleted)
                return false;

            return !searchTerms || t.isNew || (t.name && searchTerms.every(ex => t.name.match(ex)));
        }));
    };

    const refreshLists = () => {
        lists.set(getListsSorted());
    };

    const updateTask = (task, lazy, suppressSave) => {

        let t = {
            ...taskIndex.get(task.id),
            ...task
        };

        if (!taskIndex.index(t))
            return false;

        if (!lazy)
            refreshTasks();

        if (!suppressSave) {
            boardDoc
                .collection("tasks")
                .doc(task.id)
                .set(t);
        }

        return true;
    };

    const updateList = (list, lazy, suppressSave) => {

        let l = {
            ...listIndex.get(list.id),
            ...list
        };

        if (!listIndex.index(l))
            return false;

        if (!lazy)
            refreshLists();

        if (!suppressSave) {
            boardDoc
                .collection("lists")
                .doc(list.id)
                .set(l);
        }

        return true;
    };

    const reorderListTasks = (listId, lazy) => {
        let dirty = false;
        taskIndex
            .filter(t => t.listId == listId && !t.deleted)
            .sort((a, b) => a.order - b.order)
            .forEach((task, index) => {
                dirty |= updateTask({...task, order: index}, true);
            });
        if (dirty && !lazy)
            refreshTasks();
    };

    const reorderLists = (lazy) => {
        let dirty = false;
        listIndex
            .filter(l => !l.deleted)
            .sort((a, b) => a.order - b.order)
            .forEach((task, index) => {
                dirty |= updateList({...task, order: index}, true);
            });
        if (dirty && !lazy)
            refreshLists();
    };

    const getListTasksSorted = (listId) => {
        return taskIndex
            .filter(t => t.listId == listId && !t.deleted)
            .sort((a, b) => a.order - b.order);
    };

    const getVisibleListTasks = (listId) => {
        return tasks
            .get()
            .filter(t => t.listId == listId && !t.deleted)
            .sort((a, b) => a.order - b.order);
    };

    const getSortedTaskOrderList = (listId) => {
        return getOrderList(tasks.get(), t => t.listId == listId);
    };

    const moveTaskToList = (taskId, listId) => {
        let task = taskIndex.get(taskId);
        if (task.listId == listId)
            return false;

        activateTask(taskId);
        updateTask({
            id: taskId,
            listId,
            order: getListTasksSorted(listId).length
        });
        reorderListTasks(task.listId);
    };

    const hardDeleteTask = (task) => {
        boardDoc
            .collection("tasks")
            .doc(task.id)
            .delete();
    };

    function activateTask(id) {
        batchUpdatesAndNotify(
            () => {
                set("activeTaskId", id);
            }, () => {
                store.silently(() => {
                    if (get("activeTaskId") == id)
                        set("activeTaskId", null);
                })
            }
        )
    }

    function deleteTask(task) {
        let listTasks = getListTasksSorted(task.listId);
        let taskIndex = listTasks.indexOf(task);

        updateTask({
            id: task.id,
            deleted: true,
            deletedDate: new Date().toISOString()
        }, true);

        let nextTask = listTasks[taskIndex + 1] || listTasks[taskIndex - 1];
        reorderListTasks(task.listId, true);
        refreshTasks();

        if (nextTask)
            activateTask(nextTask.id);
    }

    function getListsSorted() {
        return listIndex
            .values()
            .filter(l => !l.deleted)
            .sort((a, b) => a.order - b.order);
    }

    function maintenance() {
        let tasks = taskIndex.values();
        let settings = get('settings') || {};
        let dirty = false;
        for (let task of tasks) {
            if (task.completed && task.completedDate && !task.deleted) {
                let cmp = Date.parse(task.completedDate);
                if (cmp + settings.deleteCompletedTasksAfterDays * OneDayMs < Date.now()) {
                    deleteTask(task);
                    dirty = true;
                }
            }

            if (task.deleted && Date.now() - Date.parse(task.deletedDate) > settings.purgeDeletedObjectsAfterDays * OneDayMs)
                hardDeleteTask(task);
        }
    }

    return {
        onInit() {
            this.addTrigger('refreshTasks', ['settings', 'search'], refreshTasks, true);
        },

        onDestroy() {
            unsubscribeLists && unsubscribeLists();
            unsubscribeTasks && unsubscribeTasks();
        },

        addList(e) {
            if (e) e.preventDefault();
            let id = uid();
            updateList({
                id: id,
                name: "New List",
                edit: true,
                createdDate: new Date().toISOString(),
                boardId: boardId,
                order: getListsSorted().length
            });
        },

        onSaveList(e, {store}) {
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

        deleteList(e, {store}) {
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

        addTask(e, {store}) {
            e.preventDefault();
            let listId = store.get("$list.id");
            let id = uid();
            updateTask({
                id: id,
                listId,
                order: 1e6
            }, true, true);
            reorderListTasks(listId);
            set("newTaskId", id);
        },

        moveTaskUp(e, {store}) {
            e.stopPropagation();
            e.preventDefault();
            let {$task} = store.getData();
            let visibleTasks = getVisibleListTasks($task.listId);
            let index = visibleTasks.indexOf($task);
            if (index > 0) {
                updateTask({
                    ...$task,
                    order: visibleTasks[index - 1].order - 0.1
                }, true, true);
                reorderListTasks($task.listId);
            }
        },

        moveTaskDown(e, {store}) {
            e.stopPropagation();
            e.preventDefault();
            let {$task} = store.getData();
            let visibleTasks = getVisibleListTasks($task.listId);
            let index = visibleTasks.indexOf($task);
            if (index + 1 < visibleTasks.length) {
                updateTask({
                    ...$task,
                    order: visibleTasks[index + 1].order + 0.1
                }, true, true);
                reorderListTasks($task.listId);
            }
        },

        moveTaskRight(e, {store}) {
            e.stopPropagation();
            e.preventDefault();
            let {$task} = store.getData();
            let lists = getListsSorted();
            lists.sort((a, b) => a.order - b.order);
            let listIndex = lists.findIndex(a => a.id == $task.listId);
            if (listIndex + 1 < lists.length)
                moveTaskToList($task.id, lists[listIndex + 1].id);
        },

        moveTask(e, {store}) {
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

        moveTaskLeft(e, {store}) {
            e.stopPropagation();
            e.preventDefault();
            let {$task} = store.getData();
            let lists = getListsSorted();
            lists.sort((a, b) => a.order - b.order);
            let listIndex = lists.findIndex(a => a.id == $task.listId);
            if (listIndex > 0) moveTaskToList($task.id, lists[listIndex - 1].id);
        },

        insertTaskAtCertainPoint(e, instance) {
            e.stopPropagation();
            e.preventDefault();
            let {store, data} = instance;
            let t = data.task;
            let {$task} = store.getData();

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
            let {store} = instance;
            let {$task} = store.getData();
            let code = c => c.charCodeAt(0);

            switch (e.keyCode) {
                case KeyCode.delete:
                case code("D"):
                    if (e.keyCode === code("D") && !e.shiftKey) return;

                    deleteTask($task);

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
                    if (e.ctrlKey) {
                        e.stopPropagation();
                        this.moveTaskRight(e, instance);
                    }
                    break;

                case KeyCode.left:
                    if (e.ctrlKey) {
                        e.stopPropagation();
                        this.moveTaskLeft(e, instance);
                    }
                    break;
            }
        },

        replaceLists(e, {store}) {
            let targetIndex = store.get("$index");
            let sourceIndex = e.source.store.get("$index");

            store.update("$page.lists", widgets => {
                    let secondList = widgets[sourceIndex];
                    let firstList = widgets[targetIndex];
                    //this.swapLists(secondList, firstList)
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

        listMoveLeft(e, {store}) {
            let {$list} = store.getData();
            let lists = getListsSorted();
            let index = lists.findIndex(l => l.id == $list.id)
            if (index > 0) {
                updateList({
                    ...$list,
                    order: lists[index - 1].order - 0.1
                }, true, true);
                reorderLists();
            }
        },

        listMoveRight(e, {store}) {
            let {$list} = store.getData();
            let lists = getListsSorted();
            let index = lists.findIndex(l => l.id == $list.id)
            if (index + 1 < lists.length) {
                updateList({
                    ...$list,
                    order: lists[index + 1].order + 0.1
                }, true, true);
                reorderLists();
            }
        },

        boardMoveLeft(e, {store}) {
            let {boards, $board} = store.getData();
            let orderList = getOrderList(boards);
            let index = orderList.indexOf($board.order)

            if (index != 0) {
                this.swapBoards(store, $board, boards, orderList, index, index - 1);
            }
        },


        boardMoveRight(e, {store}) {
            let {boards, $board} = store.getData();
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

        deleteBoard(e, {store}) {
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

        saveBoard(e, {store}) {
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