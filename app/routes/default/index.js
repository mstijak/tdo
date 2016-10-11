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

let searchTerms = null;
let searchQuery = null;


function filterItems(item, {search, list}) {
    if (item.listId != list.id)
        return false;

    if (!item.isNew && search && search.query) {
        if (searchQuery != search.query) {
            searchTerms = search.query.split(' ').map(w=>new RegExp(w, 'gi'));
            searchQuery = search.query;
        }
        return item.name && searchTerms.every(ex=>item.name.match(ex));
    }
    return true;
}

export default <cx>
    <div class="cxb-taskboard" controller={Controller} layout={FirstVisibleChildLayout}>
        <div class="cxe-taskboard-loading" visible:expr="{$page.status}=='loading'">
            Loading...
        </div>
        <div class="cxe-taskboard-error" visible:expr="{$page.status}=='error'">
            Error occurred while fetching data from GitHub. <Button onClick="load">Retry</Button>
        </div>
        <div class="cxe-taskboard-lists">
            <Repeater records:bind="lists" recordName="$list" keyField="id">
                <div class="cxb-tasklist" style:bind="$list.listStyle" onKeyDown="onTaskListKeyDown">
                    <div>
                        <h2
                            class="cxe-tasklist-header"
                            text:bind="$list.name"
                            style:bind="$list.headerStyle"
                            onClick={(e, {store}) => { store.set('$list.edit', true)}} />
                        <ListEditor visible:expr="!!{$list.edit}" />
                        <Menu>
                            <Repeater records:bind="tasks"
                                      recordName="$task"
                                      keyField="id"
                                      filter={filterItems}
                                      filterParams={{
                                          list: {bind: '$list'},
                                          search: {bind: 'search'}
                                      }}>
                                <Task bind="$task" onKeyDown="onTaskKeyDown" />
                            </Repeater>
                            <a class="cxe-tasklist-add" onClick="addTask" href="#">Add Task</a>
                        </Menu>
                    </div>
                </div>
            </Repeater>
            <div class="cxb-tasklist" onKeyDown="onTaskListKeyDown">
                <Menu>
                    <a class="cxe-tasklist-add" onClick="addList" href="#">Add List</a>
                </Menu>
            </div>
        </div>
    </div>
</cx>;
