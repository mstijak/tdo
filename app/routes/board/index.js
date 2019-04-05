import {Repeater, Menu, MenuItem, Button, DropZone, DragSource, DragHandle, Icon} from 'cx/widgets';
import {FirstVisibleChildLayout, LabelsTopLayout} from 'cx/ui';

import {Task} from './Task';

import Controller from './Controller';
import ListEditor from './ListEditor';
import BoardEditor from './BoardEditor';

function filterItems(item, listId) {
    return item.listId === listId;
}

function filterBoards(b, activeBoardId) {
    return b.id == activeBoardId && !b.deleted;
}

function filterLists(l, activeListId) {
    return l.listId == activeListId && !l.deleted;
}

const editTaskboard = (e, {store}) => {
    e.preventDefault();
    store.toggle('$list.edit')
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
                <Repeater
                    records-bind="$page.lists"
                    recordName="$list"
                    keyField="id"
                    sortField="order"
                    sortDirection="ASC"
                    filterParams-bind="$route.listId"
                    filter={filterLists}
                >
                    <DropZone
                        onDropTest={e => e.source.data.type == "list"}
                        onDrop='replaceLists'
                        class-tpl="cxb-tasklist {$list.className}"
                        style-bind="$list.listStyle"
                    >
                        <DragSource data={{type: 'list'}} style="cursor:move;padding:1px">
                            <header class="cxe-tasklist-header">
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
                            </header>
                        </DragSource>
                        <ListEditor visible-expr="!!{$list.edit}"/>
                        <Menu class="cxe-tasklist-items" onKeyDown="onTaskListKeyDown" itemPadding="small">
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
                                    <DragSource data={{type: 'item'}}>
                                        <DropZone
                                            onDrop="moveTask"
                                            onDropTest={e => e.source.data.type == "item"}
                                            inflate={30}
                                        >
                                            <DragHandle
                                                style="position:fixed; display: inline;margin:3px; cursor:move;font-size:15px">
                                                <div class="drag-icon"> &#x2807;
                                                </div>
                                            </DragHandle>
                                            <Task
                                                bind="$task"
                                                styleRules-bind="settings.taskStyles"
                                                autoFocus-expr="{activeTaskId}=={$task.id}"
                                                isNew-expr="{newTaskId}=={$task.id}"
                                                onKeyDown="onTaskKeyDown"
                                                onSave="onSaveTask"
                                            >
                                                <Icon name="drop-down"/>
                                            </Task>
                                        </DropZone>
                                    </DragSource>
                                </MenuItem>
                            </Repeater>

                            <a class="cxe-tasklist-add" onClick="addTask" href="#">Add Task</a>
                        </Menu>
                    </DropZone>
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
                           onClick={(e, {store}) => {
                               e.preventDefault();
                               store.set('$board.edit', true)
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
    /cx>;
