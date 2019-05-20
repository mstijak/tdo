import { FocusManager, batchUpdatesAndNotify } from "cx/ui";
import { ArrayRef } from "cx/data";
import { KeyCode, closest, getSearchQueryPredicate } from "cx/util";

import uid from "uid";
import { BoardTasksTracker } from "../../data/BoardTasksTracker";
import { BoardListsTracker } from "../../data/BoardListsTracker";

const OneDayMs = 24 * 60 * 60 * 1000;

export default ({ store, ref, get, set }) => {

    const lists = ref("$page.lists").as(ArrayRef);
    const tasks = ref("$page.tasks").as(ArrayRef);
    const boardId = get("$route.boardId");

    let maintenancePerformed = false;

    const refreshTasks = () => {
        let searchTerms = null;
        let search = get("search");

        if (search && search.query)
            searchTerms = search.query.split(" ").filter(Boolean).map(w => new RegExp(w, "gi"));

        tasks.set(taskTracker.index.filter(t => {
            if (t.deleted)
                return false;

            return !searchTerms || t.isNew || (t.name && searchTerms.every(ex => t.name.match(ex)));
        }));

        if (!maintenancePerformed) {
            maintenancePerformed = true;
            setTimeout(maintenance, 1);
        }
    };

    const taskTracker = new BoardTasksTracker(boardId, refreshTasks);

    const refreshLists = () => {
        lists.set(getListsSorted());
    };

    const listTracker = new BoardListsTracker(boardId, refreshLists);

    const getVisibleListTasks = (listId) => {
        return tasks
            .get()
            .filter(t => t.listId == listId && !t.deleted)
            .sort((a, b) => a.order - b.order);
    };

    function activateTask(id) {
        let taskEl = document.getElementById(`task-${id}`);
        if (taskEl)
            taskEl.focus();
    }

    function editTask(id) {
        batchUpdatesAndNotify(
            () => {
                set("newTaskId", id);
            }, () => {
                if (get("newTaskId") == id)
                    store.silently(() => set("newTaskId", null));
            }
        );
    }

    function deleteTask(task) {

        let listTasks = getVisibleListTasks(task.listId);
        let taskIndex = listTasks.findIndex(t => t.id == task.id);
        let nextTask = listTasks[taskIndex + 1] || listTasks[taskIndex - 1];

        batchUpdatesAndNotify(() => {
            taskTracker.update(task.id, {
                deleted: true,
                deletedDate: new Date().toISOString()
            }, { suppressUpdate: true });
            taskTracker.reorderList(task.listId, true);
            refreshTasks();
        }, () => {
            if (nextTask) {
                activateTask(nextTask.id);
                console.log(nextTask);
            }
        });
    }

    function getListsSorted() {
        return listTracker.index
            .values()
            .filter(l => !l.deleted)
            .sort((a, b) => a.order - b.order);
    }

    function maintenance() {
        let tasks = taskTracker.index.values();
        let settings = get("settings") || {};
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
                taskTracker.delete(task.id);
        }
    }

    return {
        onInit() {
            this.addTrigger("refreshTasks", ["settings", "search"], refreshTasks, true);

            listTracker.start();
            taskTracker.start();
        },

        onDestroy() {
            listTracker.stop();
            taskTracker.stop();
        },

        onAddList(e) {
            if (e) e.preventDefault();
            let id = uid();
            listTracker.update(
                id, {
                    id: id,
                    name: "New List",
                    edit: true,
                    createdDate: new Date().toISOString(),
                    boardId: boardId,
                    order: getListsSorted().length
                });
        },

        onSaveList(e, { store }) {
            let list = store.get("$list");
            listTracker.update(list.id, {
                ...list,
                edit: null,
                lastChangeDate: new Date().toISOString()
            });
        },

        onDeleteList(e, { store }) {
            let id = store.get("$list.id");
            listTracker.update(id, {
                deleted: true,
                deletedDate: new Date().toISOString()
            }, { suppressUpdate: true });
            listTracker.reorder(true);
            listTracker.forceUpdate();
        },

        onSaveTask(task) {
            taskTracker.update(task.id, task);
        },

        onAddTask(e, { store }) {
            e.preventDefault();
            let listId = store.get("$list.id");
            let id = uid();
            taskTracker.add({
                    id,
                    name: null,
                    listId,
                    createdDate: new Date().toISOString(),
                    order: 1e6
                }, { suppressUpdate: true, suppressSync: true }
            );
            taskTracker.reorderList(listId);
            editTask(id);
        },

        moveTaskUp(e, { store }) {
            e.stopPropagation();
            e.preventDefault();
            let { $task } = store.getData();
            let visibleTasks = getVisibleListTasks($task.listId);
            let index = visibleTasks.indexOf($task);
            if (index > 0) {
                taskTracker.update(
                    $task.id,
                    {
                        order: visibleTasks[index - 1].order - 0.1
                    },
                    { suppressSync: true, suppressUpdate: true }
                );
                taskTracker.reorderList($task.listId);
            }
        },

        moveTaskDown(e, { store }) {
            e.stopPropagation();
            e.preventDefault();
            let { $task } = store.getData();
            let visibleTasks = getVisibleListTasks($task.listId);
            let index = visibleTasks.indexOf($task);
            if (index + 1 < visibleTasks.length) {
                taskTracker.update($task.id, {
                    order: visibleTasks[index + 1].order + 0.1
                }, { suppressSync: true, suppressUpdate: true });
                taskTracker.reorderList($task.listId);
            }
        },

        moveTaskLeft(e, { store }) {
            e.stopPropagation();
            e.preventDefault();
            let { $task } = store.getData();
            let lists = getListsSorted();
            let listIndex = lists.findIndex(a => a.id == $task.listId);
            if (listIndex > 0) {
                batchUpdatesAndNotify(() => {
                    taskTracker.moveTaskToList($task.id, lists[listIndex - 1].id);
                }, () => {
                    activateTask($task.id);
                });
            }
        },

        moveTaskRight(e, { store }) {
            e.stopPropagation();
            e.preventDefault();
            let { $task } = store.getData();
            let lists = getListsSorted();
            lists.sort((a, b) => a.order - b.order);
            let listIndex = lists.findIndex(a => a.id == $task.listId);
            if (listIndex + 1 < lists.length) {
                batchUpdatesAndNotify(() => {
                    taskTracker.moveTaskToList($task.id, lists[listIndex + 1].id);
                }, () => {
                    activateTask($task.id);
                })
            }
        },

        onTaskDrop(e, { store, data }) {
            let task = e.source.store.get("$task");
            let { order, listId } = data.data;

            taskTracker.update(task.id, {
                listId,
                order
            }, { suppressUpdate: true, suppressSync: true });

            taskTracker.reorderList(listId);

            if (listId != task.listId)
                taskTracker.reorderList(task.listId);
        },

        onListDrop(e, { store, data }) {
            let list = e.source.store.get("$list");
            let { order } = data.data;

            listTracker.update(list.id, {
                order
            }, { suppressSync: true, suppressUpdate: true });

            listTracker.reorder();
        },

        onTaskKeyDown(e, instance) {
            let { store } = instance;
            let { $task } = store.getData();
            let code = c => c.charCodeAt(0);

            switch (e.keyCode) {
                case KeyCode.delete:
                case code("D"):
                    if (e.keyCode === code("D") && !e.shiftKey) return;

                    e.preventDefault();
                    e.stopPropagation();

                    deleteTask($task);

                    break;

                case KeyCode.insert:
                case code("O"):
                    e.preventDefault();
                    e.stopPropagation();

                    let offset = -0.1;
                    if (e.ctrlKey || (e.keyCode === code("O") && !e.shiftKey))
                        offset = +0.1;

                    let id = uid();
                    taskTracker.add({
                        id,
                        listId: $task.listId,
                        order: $task.order + offset,
                        createdDate: new Date().toISOString()
                    }, { suppressUpdate: true, suppressSync: true });
                    taskTracker.reorderList($task.listId);
                    editTask(id);
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

        onTaskListKeyDown(e, instance) {
            let code = c => c.charCodeAt(0),
                list;

            switch (e.keyCode) {
                case code("K"):
                    if (e.currentTarget.previousSibling && e.currentTarget.previousSibling.previousSibling)
                        FocusManager.focusFirst(e.currentTarget.previousSibling.previousSibling);
                    break;

                case code("J"):
                    if (e.currentTarget.nextSibling && e.currentTarget.nextSibling.nextSibling)
                        FocusManager.focusFirst(e.currentTarget.nextSibling.nextSibling);
                    break;

                case KeyCode.left:
                case code("H"):
                case code("B"):
                    list = closest(e.target, el => el.classList.contains("cxb-tasklist"));
                    if (list.previousSibling && list.previousSibling.previousSibling)
                        FocusManager.focusFirst(list.previousSibling.previousSibling);
                    break;

                case KeyCode.right:
                case code("W"):
                case code("L"):
                    list = closest(e.target, el => el.classList.contains("cxb-tasklist"));
                    if (list.nextSibling && list.nextSibling.nextSibling)
                        FocusManager.focusFirst(list.nextSibling.nextSibling);
                    break;
            }
        },

        onMoveListLeft(e, { store }) {
            let { $list } = store.getData();
            let lists = getListsSorted();
            let index = lists.findIndex(l => l.id == $list.id);
            if (index > 0) {
                listTracker.update($list.id, {
                    order: lists[index - 1].order - 0.1
                }, { suppressUpdate: true, suppressSync: true });
                listTracker.reorder();
            }
        },

        onMoveListRight(e, { store }) {
            let { $list } = store.getData();
            let lists = getListsSorted();
            let index = lists.findIndex(l => l.id == $list.id);
            if (index + 1 < lists.length) {
                listTracker.update($list.id, {
                    order: lists[index + 1].order + 0.1
                }, { suppressUpdate: true, suppressSync: true });
                listTracker.reorder();
            }
        },

        onEditList(e, { store }) {
            e.preventDefault();
            listTracker.update(store.get("$list.id"), {
                edit: true
            });
        }
    };
}
