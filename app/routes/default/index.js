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


function filterItems(item, list) {
    return item.listId == list.id;
}

export default <cx>
    <div class="cxb-taskboard" controller={Controller} layout={FirstVisibleChildLayout}>
        <div class="cxe-taskboard-loading" visible:expr="{$page.status}=='loading'">
            Loading...
        </div>
        <div class="cxe-taskboard-error" visible:expr="{$page.status}=='error'">
            Error occurred while fetching data from GitHub. <Button onClick="load">Retry</Button>
        </div>
        <div>
            <Repeater records:bind="lists" recordName="$list">
                <div class="cxb-tasklist">
                    <div>
                        <h2 class="cxe-tasklist-header" text:bind="$list.name" onClick={(e, {store}) => { store.set('$list.edit', true)}} />
                        <ListEditor visible:expr="!!{$list.edit}" />
                        <Menu visible:expr="!{$list.edit}">
                            <Repeater records:bind="tasks"
                                      recordName="$task"
                                      keyField="id"
                                      filter={filterItems}
                                      filterParams:bind="$list">
                                <Task bind="$task" onKeyDown="onTaskKeyDown" />
                            </Repeater>
                            <a class="cxe-tasklist-add" onClick="addTask" href="#">Add Task</a>
                        </Menu>
                    </div>
                </div>
            </Repeater>
            <a class="cxe-tasklist-add" onClick="addList" href="#">Add List</a>
        </div>
    </div>
</cx>;
