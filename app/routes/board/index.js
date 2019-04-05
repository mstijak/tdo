import { Repeater, Menu, MenuItem, Button, DropZone, DragSource, DragHandle, Icon } from "cx/widgets";
import { FirstVisibleChildLayout, LabelsTopLayout } from "cx/ui";

import { Task } from "./Task";

import Controller from "./Controller";
import ListEditor from "./ListEditor";
import BoardEditor from "./BoardEditor";

function filterItems(item, listId) {
  return item.listId === listId;
}

function filterBoards(b, activeBoardId) {
  return b.id == activeBoardId && !b.deleted;
}

function filterLists(l, activeListId) {
  return l.listId == activeListId && !l.deleted;
}

const editTaskboard = (e, { store }) => {
  e.preventDefault();
  store.toggle("$list.edit");
};

export default <cx>
  <div class="cxb-taskboard" controller={Controller} layout={FirstVisibleChildLayout}>
    <div class="cxe-taskboard-loading" visible-expr="{$page.status}=='loading'">
      Loading...
    </div>
    <div class="cxe-taskboard-error" visible-expr="{$page.status}=='error'">
      Error occurred while fetching data from GitHub. <Button onClick="load">Retry</Button>
    </div>
    <Repeater
      records-bind="boards"
      recordName="$board"
      keyField="id"
      filter={filterBoards}
      filterParams-bind="$route.boardId"
    >
      <div
        class-tpl="cxe-taskboard-lists {$board.className}"
        style-bind="$board.style"
      >
        <DropZone
          mod="inline-block"
          matchWidth
          matchHeight
          matchMargin
          inflate={200}
          onDropTest={e => e.source.data.type == "list"}
          onDrop='onListDrop'
          data={{
            order: -0.1
          }}
        />
        <Repeater
          records-bind="$page.lists"
          recordName="$list"
          keyField="id"
          sortField="order"
          sortDirection="ASC"
          filterParams-bind="$route.listId"
          filter={filterLists}
        >
          <DragSource
            data={{ type: "list" }}
            handled
            hideOnDrag
            class-tpl="cxb-tasklist {$list.className}"
            style-bind="$list.listStyle"
          >
            <DragHandle class="cxe-tasklist-header">
              <h2
                class-tpl="{$list.headerClass}"
                text-bind="$list.name"
                style-bind="$list.headerStyle"
                onDoubleClick={editTaskboard}
              />
              <a
                href="#"
                style="padding-left: 10px;"
                tabIndex={-1}
                onClick={editTaskboard}
              >
                &#x270e;
              </a>
            </DragHandle>
            <ListEditor visible-expr="!!{$list.edit}"/>
            <Menu class="cxe-tasklist-items" onKeyDown="onTaskListKeyDown" itemPadding="small">
              <DropZone
                onDrop="onTaskDrop"
                onDropTest={e => e.source.data.type == "item"}
                inflate={30}
                mod="block"
                data={{
                  order: -0.1,
                  listId: { bind: "$list.id" }
                }}
              />
              <Repeater
                records-bind="$page.tasks"
                recordName="$task"
                keyField="id"
                sortField="order"
                sortDirection="ASC"
                filter={filterItems}
                filterParams-bind="$list.id"
              >
                <MenuItem class="menu-item">
                  <DragSource data={{ type: "item" }} hideOnDrag handled>
                    <DragHandle style="position:fixed; display: inline; margin:3px; cursor: move; font-size:15px">
                      <div class="drag-icon">&#x2807;</div>
                    </DragHandle>
                    <Task
                      bind="$task"
                      styleRules-bind="settings.taskStyles"
                      autoFocus-expr="{activeTaskId}=={$task.id}"
                      isNew-expr="{newTaskId}=={$task.id}"
                      onKeyDown="onTaskKeyDown"
                      onSave="onSaveTask"
                    />
                  </DragSource>
                </MenuItem>
                <DropZone
                  onDrop="onTaskDrop"
                  onDropTest={e => e.source.data.type == "item"}
                  inflate={30}
                  mod="block"
                  data={{
                    order: { expr: "{$task.order}+0.1" },
                    listId: { bind: "$task.listId" }
                  }}
                  matchHeight
                />
              </Repeater>

              <a class="cxe-tasklist-add" onClick="addTask" href="#">Add Task</a>
            </Menu>
          </DragSource>

          <DropZone
            mod="inline-block"
            matchWidth
            matchHeight
            matchMargin
            inflate={200}
            onDropTest={e => e.source.data.type == "list"}
            onDrop='onListDrop'
            data={{
              order: { expr: "{$list.order}+0.1" }
            }}
          />
        </Repeater>

        <div class="cxb-tasklist">
          <Menu class="cxe-tasklist-items" onKeyDown="onTaskListKeyDown" itemPadding="small">
            <a class="cxe-tasklist-add"
               onClick="addList"
               href="#"
            >
              Add List
            </a>

            <a class="cxe-tasklist-add"
               onClick={(e, { store }) => {
                 e.preventDefault();
                 store.set("$board.edit", true);
               }}
               href="#"
            >
              Edit Board
            </a>
          </Menu>
          <BoardEditor visible-expr="!!{$board.edit}"/>
        </div>
      </div>
    </Repeater>
  </div>
  <
  /cx>;;;
