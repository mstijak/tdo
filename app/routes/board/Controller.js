import { Controller, FocusManager, batchUpdatesAndNotify } from "cx/ui";
import { append, updateArray } from "cx/data";
import { KeyCode, closest, isNonEmptyArray } from "cx/util";

import { removeBoard, gotoAnyBoard } from "app/data/actions";

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

export default class extends Controller {
  onInit() {
    let boardId = this.store.get("$route.boardId");

    this.boardDoc = firestore.collection("boards").doc(boardId);

    this.unsubscribeLists = this.boardDoc
      .collection("lists")
      .onSnapshot(snapshot => {
        this.store.update("$page.lists", lists =>
          mergeFirestoreSnapshot(lists, snapshot, "LISTS")
        );
      });

    this.unsubscribeTasks = this.boardDoc
      .collection("tasks")
      .onSnapshot(snapshot => {
        this.store.update("$page.tasks", tasks =>
          mergeFirestoreSnapshot(tasks, snapshot, "TASKS")
        );
      });
  }

  onDestroy() {
    this.unsubscribeLists && this.unsubscribeLists();
    this.unsubscribeTasks && this.unsubscribeTasks();
  }

  addList(e, { store }) {
    if (e) e.preventDefault();

    let boardId = store.get("$route.boardId"),
      id = uid();

    this.boardDoc
      .collection("lists")
      .doc(id)
      .set({
        id: id,
        name: "New List",
        edit: true,
        createdDate: new Date().toISOString(),
        boardId: boardId
      });
  }

  onSaveList(e, { store }) {
    //store.delete('$list.edit')
    let list = store.get("$list");
    console.log("SAVE LIST", list);
    this.boardDoc
      .collection("lists")
      .doc(list.id)
      .set({
        ...list,
        edit: false,
        lastChangeDate: new Date().toISOString()
      });
  }

  deleteList(e, { store }) {
    let id = this.store.get("$list.id");

    this.boardDoc
      .collection("lists")
      .doc(id)
      .update({
        deleted: true,
        deletedDate: new Date().toISOString()
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
    };
  }

  onSaveTask(task) {
    this.store.update(
      "$page.tasks",
      updateArray,
      _ => task,
      t => t.id == task.id
    );

    this.boardDoc
      .collection("tasks")
      .doc(task.id)
      .set(task);
  }

  updateTask(task) {
      this.boardDoc
          .collection("tasks")
          .doc(task.id)
          .update(task);

      this.store.update(
          "$page.tasks",
          updateArray,
          t => ({...t, ...task}),
          t => t.id === task.id
      );
  }

  updateList(list) {
    this.store.update(
      "$page.lists",
      updateArray,
      t => ({ ...t, ...list }),
      t => t.id === list.id
    );

    this.boardDoc
      .collection("lists")
      .doc(list.id)
      .update(list);
  }

  getSortedTaskOrderList(listId) {
    let tasks = this.store.get("$page.tasks");
    let order = tasks
      .filter(t => !t.deleted && t.listId == listId)
      .map(t => t.order);
    order.sort();
    return order;
  }

  addTask(e, { store }) {
    e.preventDefault();
    let listId = store.get("$list.id");
    let task = this.prepareTask(listId);
    this.store.update("$page.tasks", append, task);
    this.boardDoc
      .collection("tasks")
      .doc(task.id)
      .set(task);
  }

  moveTaskUp(e, { store }) {
    e.stopPropagation();
    e.preventDefault();
    let { $task } = store.getData();
    let order = this.getSortedTaskOrderList($task.listId);
    let newOrder = getPrevOrder($task.order, order);
    this.onSaveTask({
      ...$task,
      order: newOrder
    });
  }

  moveTaskDown(e, { store }) {
    e.stopPropagation();
    e.preventDefault();
    let { $task } = store.getData();
    let order = this.getSortedTaskOrderList($task.listId);
    let newOrder = getNextOrder($task.order, order);
    this.onSaveTask({
      ...$task,
      order: newOrder
    });
  }

  moveTaskToList(taskId, listId) {
    let order = this.getSortedTaskOrderList(listId);
    let taskOrder = (order[order.length - 1] || 0) + 1;
    this.store.set("activeTaskId", taskId);
    return this.updateTask({
      id: taskId,
      listId,
      order: taskOrder
    });
  }

  moveTaskRight(e, { store }) {
    e.stopPropagation();
    e.preventDefault();
    let { $page, $task } = store.getData();
    let lists = $page.lists.filter(a => !a.deleted);
    lists.sort((a, b) => a.order - b.order);
    let listIndex = lists.findIndex(a => a.id == $task.listId);
    if (listIndex + 1 < lists.length)
      this.moveTaskToList($task.id, lists[listIndex + 1].id);
  }

  moveTaskLeft(e, { store }) {
    e.stopPropagation();
    e.preventDefault();
    let { $page, $task } = store.getData();
    let lists = $page.lists.filter(a => !a.deleted);
    lists.sort((a, b) => a.order - b.order);
    let listIndex = lists.findIndex(a => a.id == $task.listId);
    if (listIndex > 0) this.moveTaskToList($task.id, lists[listIndex - 1].id);
  }

  onTaskKeyDown(e, instance) {
    let t = instance.data.task;
    let { store } = instance;
    let { $task } = store.getData();

    let code = c => c.charCodeAt(0);
    switch (e.keyCode) {
      case KeyCode.delete:
      case code("D"):
        if (e.keyCode === code("D") && !e.shiftKey) return;

          let item = closest(e.target, el =>
              el.classList.contains("cxe-menu-item")
          );
          let elementReceivingFocus = item.nextSibling || item.previousSibling;

          batchUpdatesAndNotify(() => {
              this.updateTask({
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
        let nt = this.prepareTask(t.listId);
        let order = this.getSortedTaskOrderList(t.listId);
        let index = order.indexOf($task.order);

        //TODO: Fix insertion point
        let below =
          index < order.length - 1 && e.keyCode === code("O") && !e.shiftKey;
        nt.order = below
          ? getNextOrder($task.order, order)
          : getPrevOrder($task.order, order);

        this.store.set("activeTaskId", nt.id);
        this.onSaveTask(nt);
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
  }

  listMoveLeft(e, { store }) {
    let { $page, $list } = store.getData();
    let listOrder = $page.lists.filter(a => !a.deleted).map(l => l.order);
    let newOrder = getPrevOrder($list.order, listOrder);
    this.updateList({
      id: $list.id,
      order: newOrder || 0
    });
  }

  listMoveRight(e, { store }) {
    let { $page, $list } = store.getData();
    let listOrder = $page.lists.filter(a => !a.deleted).map(l => l.order);
    let newOrder = getNextOrder($list.order, listOrder);
    this.updateList({
      id: $list.id,
      order: newOrder || 0
    });
  }

  boardMoveLeft(e, { store }) {
    let { boards, $board } = store.getData();
    let boardOrder = boards.filter(a => !a.deleted).map(l => l.order);
    let newOrder = getPrevOrder($board.order, boardOrder);
    let userId = store.get("user.id");

    firestore
      .collection("users")
      .doc(userId)
      .collection("boards")
      .doc($board.id)
      .update({
        id: $board.id,
        order: newOrder || 0
      });
  }

  boardMoveRight(e, { store }) {
    let { boards, $board } = store.getData();
    let boardOrder = boards.filter(a => !a.deleted).map(l => l.order);
    let newOrder = getNextOrder($board.order, boardOrder);
    let userId = store.get("user.id");

    firestore
      .collection("users")
      .doc(userId)
      .collection("boards")
      .doc($board.id)
      .update({
        id: $board.id,
        order: newOrder || 0
      });
  }

  deleteBoard(e, { store }) {
    this.boardDoc.update({
      deleted: true,
      deletedDate: new Date().toISOString()
    });
  }

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

function getPrevOrder(currentOrder, orderList) {
  orderList.sort();
  let index = orderList.indexOf(currentOrder);
  if (index == -1) return 0;
  if (index == 0) return orderList[0];
  if (index == 1) return orderList[0] - 1;
  return (orderList[index - 2] + orderList[index - 1]) / 2;
}

function getNextOrder(currentOrder, orderList) {
  orderList.sort();
  let index = orderList.indexOf(currentOrder);
  if (index == -1) return 0;
  if (index + 1 == orderList.length) return orderList[orderList.length - 1];
  if (index + 2 == orderList.length) return orderList[orderList.length - 1] + 1;
  return (orderList[index + 1] + orderList[index + 2]) / 2;
}
