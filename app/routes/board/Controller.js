import { FocusManager, batchUpdatesAndNotify } from "cx/ui";
import { ArrayRef, updateArray } from "cx/data";
import { KeyCode, closest, getSearchQueryPredicate } from "cx/util";

import uid from "uid";
import { firestore } from "../../data/db/firestore";
import { ShallowIndex } from "../../data/ShallowIndex";

const OneDayMs = 24 * 60 * 60 * 1000;

export default ({ store, ref, get, set }) => {

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
    let search = get("search");

    if (search && search.query)
      searchTerms = search.query.split(" ").filter(Boolean).map(w => new RegExp(w, "gi"));

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
        dirty |= updateTask({ ...task, order: index }, true);
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
        dirty |= updateList({ ...task, order: index }, true);
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
        });
      }
    );
  }

  function editTask(id) {
    batchUpdatesAndNotify(
      () => {
        set("newTaskId", id);
      }, () => {
        store.silently(() => {
          if (get("newTaskId") == id)
            set("newTaskId", null);
        });
      }
    );
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
        hardDeleteTask(task);
    }
  }

  return {
    onInit() {
      if (lists.get()) listIndex.load(lists.get());
      if (tasks.get()) taskIndex.load(tasks.get());
      this.addTrigger("refreshTasks", ["settings", "search"], refreshTasks, true);
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
      let id = uid();
      updateTask({
        id: id,
        listId,
        order: 1e6
      }, true, true);
      reorderListTasks(listId);
      editTask(id);
    },

    moveTaskUp(e, { store }) {
      e.stopPropagation();
      e.preventDefault();
      let { $task } = store.getData();
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

    moveTaskDown(e, { store }) {
      e.stopPropagation();
      e.preventDefault();
      let { $task } = store.getData();
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

    moveTaskLeft(e, { store }) {
      e.stopPropagation();
      e.preventDefault();
      let { $task } = store.getData();
      let lists = getListsSorted();
      lists.sort((a, b) => a.order - b.order);
      let listIndex = lists.findIndex(a => a.id == $task.listId);
      if (listIndex > 0) moveTaskToList($task.id, lists[listIndex - 1].id);
    },

    moveTaskRight(e, { store }) {
      e.stopPropagation();
      e.preventDefault();
      let { $task } = store.getData();
      let lists = getListsSorted();
      lists.sort((a, b) => a.order - b.order);
      let listIndex = lists.findIndex(a => a.id == $task.listId);
      if (listIndex + 1 < lists.length)
        moveTaskToList($task.id, lists[listIndex + 1].id);
    },

    onTaskDrop(e, { store, data }) {
      let task = e.source.store.get("$task");
      let { order, listId } = data.data;

      updateTask({
        id: task.id,
        listId,
        order
      }, true, true);

      reorderListTasks(listId);

      if (listId != task.listId)
        reorderListTasks(task.listId);
    },

    onListDrop(e, { store, data }) {
      let list = e.source.store.get("$list");
      let { order } = data.data;

      updateList({
        id: list.id,
        order
      }, true, true);

      reorderLists();
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
          if (e.keyCode === code("O") && !e.shiftKey) return;

          e.preventDefault();
          e.stopPropagation();

          let offset = -0.1;
          if (e.ctrlKey)
            offset = +0.1;

          let id = uid();
          updateTask({
            id,
            listId: $task.listId,
            order: $task.order + offset
          }, true, true);
          reorderListTasks($task.listId);
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
          list = closest(e.target, el => el.classList.contains("cxb-tasklist"));
          if (list.previousSibling && list.previousSibling.previousSibling)
            FocusManager.focusFirst(list.previousSibling.previousSibling);
          break;

        case KeyCode.right:
        case code("L"):
          list = closest(e.target, el => el.classList.contains("cxb-tasklist"));
          if (list.nextSibling && list.nextSibling.nextSibling)
            FocusManager.focusFirst(list.nextSibling.nextSibling);
          break;
      }
    },

    listMoveLeft(e, { store }) {
      let { $list } = store.getData();
      let lists = getListsSorted();
      let index = lists.findIndex(l => l.id == $list.id);
      if (index > 0) {
        updateList({
          ...$list,
          order: lists[index - 1].order - 0.1
        }, true, true);
        reorderLists();
      }
    },

    listMoveRight(e, { store }) {
      let { $list } = store.getData();
      let lists = getListsSorted();
      let index = lists.findIndex(l => l.id == $list.id);
      if (index + 1 < lists.length) {
        updateList({
          ...$list,
          order: lists[index + 1].order + 0.1
        }, true, true);
        reorderLists();
      }
    },

    boardMoveLeft(e, { store }) {
      let { boards, $board } = store.getData();
      let orderList = getOrderList(boards);
      let index = orderList.indexOf($board.order);

      if (index != 0) {
        this.swapBoards(store, $board, boards, orderList, index, index - 1);
      }
    },


    boardMoveRight(e, { store }) {
      let { boards, $board } = store.getData();
      let orderList = getOrderList(boards);
      let index = orderList.indexOf($board.order);

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
  };
}

function getOrderList(items, filter = () => true) {
  let list = items.filter(item => !item.deleted && filter(item)).map(a => a.order);
  list.sort();
  return list;
}



