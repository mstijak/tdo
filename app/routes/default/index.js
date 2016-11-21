import {HtmlElement} from 'cx/ui/HtmlElement';
import {Repeater} from 'cx/ui/Repeater';
import {List} from 'cx/ui/List';
import {Menu} from 'cx/ui/nav/Menu';
import {TextArea} from 'cx/ui/form/TextArea';
import {Button} from 'cx/ui/Button';
import {FirstVisibleChildLayout} from 'cx/ui/layout/FirstVisibleChildLayout';
import {Md} from 'app/components/Md';
import {Task} from './Task';

import Controller from './Controller';
import ListEditor from './ListEditor';
import BoardEditor from './BoardEditor';

let searchTerms = null;
let searchQuery = null;


function filterItems(item, {search, list, settings}) {
    if (item.deleted || item.listId != list.id)
        return false;

    if (!item.isNew && search && search.query) {
        if (searchQuery != search.query) {
            searchTerms = search.query.split(' ').map(w=>new RegExp(w, 'gi'));
            searchQuery = search.query;
        }
        return item.name && searchTerms.every(ex=>item.name.match(ex));
    }

    if (item.completed && item.completedDate) {
        var now = new Date().getTime();
        var cmp = Date.parse(item.completedDate);
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
            records:bind="tdo.boards"
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
                    records:bind="tdo.lists"
                    recordName="$list"
                    keyField="id"
                    filter={filterLists}
                    filterParams:bind="$board.id"
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
                               onClick={editTaskboard}
                            >
                                &#x270e;
                            </a>
                        </header>
                        <ListEditor visible:expr="!!{$list.edit}" />
                        <Menu class="cxe-tasklist-items" onKeyDown="onTaskListKeyDown">
                            <Repeater records:bind="tdo.tasks"
                                      recordName="$task"
                                      keyField="id"
                                      filter={filterItems}
                                      filterParams={{
                                          list: {bind: '$list'},
                                          search: {bind: 'search'},
                                          settings: {bind: 'tdo.settings'}
                                      }}>
                                <Task
                                    bind="$task"
                                    styles:bind="tdo.settings.taskStyles"
                                    onKeyDown="onTaskKeyDown"
                                />
                            </Repeater>
                            <a class="cxe-tasklist-add" onClick="addTask" href="#">Add Task</a>
                        </Menu>
                    </div>
                </Repeater>
                <div class="cxb-tasklist">
                    <Menu class="cxe-tasklist-items" onKeyDown="onTaskListKeyDown">
                        <a class="cxe-tasklist-add"
                           onClick="addList"
                           href="#"
                        >
                            Add List
                        </a>

                        <a class="cxe-tasklist-add"
                           onClick={(e, {store}) => { e.preventDefault(); store.set('$board.edit', true)}}
                           href="#"
                        >
                            Edit Board
                        </a>
                    </Menu>
                    <BoardEditor visible:expr="!!{$board.edit}" />
                </div>
            </div>
        </Repeater>
    </div>
</cx>;
