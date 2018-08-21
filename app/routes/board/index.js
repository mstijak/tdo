import {Repeater, Menu, MenuItem, Button} from 'cx/widgets';
import {FirstVisibleChildLayout} from 'cx/ui';

import {Task} from './Task';

import Controller from './Controller';
import ListEditor from './ListEditor';
import BoardEditor from './BoardEditor';

let searchTerms = null;
let searchQuery = null;


function filterItems(item, {search, list, settings}) {
    if (item.deleted || item.listId != list.id)
        return false;

    if (!settings)
        settings = {};

    if (!item.isNew && search && search.query) {
        if (searchQuery != search.query) {
            searchTerms = search.query.split(' ').map(w => new RegExp(w, 'gi'));
            searchQuery = search.query;
        }
        return item.name && searchTerms.every(ex => item.name.match(ex));
    }

    if (item.completed && item.completedDate) {
        let now = new Date().getTime();
        let cmp = Date.parse(item.completedDate);
        if (cmp + settings.completedTasksRetentionDays * 24 * 60 * 60 * 1000 < now)
            return false;
    }

    return true;
}

function filterBoards(b, activeBoardId) {
    return b.id == activeBoardId && !b.deleted;
}

function filterLists(l, activeBoardId) {
    return l.boardId == activeBoardId && !l.deleted;
}

const editTaskboard = (e, {store}) => {
    e.preventDefault();
    store.toggle('$list.edit')
};

export default <cx>
    <div class="cxb-taskboard" controller={Controller} layout={FirstVisibleChildLayout}>
        <div class="cxe-taskboard-loading" visible:expr="{$page.status}=='loading'">
            Loading...
        </div>
        <div class="cxe-taskboard-error" visible:expr="{$page.status}=='error'">
            Error occurred while fetching data from GitHub. <Button onClick="load">Retry</Button>
        </div>
        <Repeater
            records:bind="boards"
            recordName="$board"
            keyField="id"
            filter={filterBoards}
            filterParams:bind="$route.boardId"
        >
            <div
                class:tpl="cxe-taskboard-lists {$board.className}"
                style:bind="$board.style"
            >
                <Repeater
                    records:bind="$page.lists"
                    recordName="$list"
                    keyField="id"
                    sortField="order"
                    sortDirection="ASC"
                >
                    <div
                        class:tpl="cxb-tasklist {$list.className}"
                        style:bind="$list.listStyle">
                        <header class="cxe-tasklist-header">
                            <h2
                                class:tpl="{$list.headerClass}"
                                text:bind="$list.name"
                                style:bind="$list.headerStyle"
                                onDoubleClick={editTaskboard}
                            />
                            <a href="#"
                               tabIndex={-1}
                               onClick={editTaskboard}
                            >
                                &#x270e;
                            </a>
                        </header>
                        <ListEditor visible:expr="!!{$list.edit}"/>
                        <Menu class="cxe-tasklist-items" onKeyDown="onTaskListKeyDown" itemPadding="small">
                            <Repeater
                                records:bind="$page.tasks"
                                recordName="$task"
                                keyField="id"
                                sortField="order"
                                sortDirection="ASC"
                                filter={filterItems}
                                filterParams={{
                                    list: {bind: '$list'},
                                    search: {bind: 'search'},
                                    settings: {bind: 'settings'}
                                }}
                            >
                                <MenuItem pad={false}>
                                    <Task
                                        bind="$task"
                                        styles:bind="settings.taskStyles"
                                        autoFocus:expr="{activeTaskId}=={$task.id}"
                                        onKeyDown="onTaskKeyDown"
                                        onSave="onSaveTask"
                                    />
                                </MenuItem>
                            </Repeater>
                            <a class="cxe-tasklist-add" onClick="addTask" href="#">Add Task</a>
                        </Menu>
                    </div>
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
                    <BoardEditor visible:expr="!!{$board.edit}"/>
                </div>
            </div>
        </Repeater>
    </div>
</cx>;
