import {HtmlElement} from 'cx/ui/HtmlElement';
import {Repeater} from 'cx/ui/Repeater';
import {List} from 'cx/ui/List';
import {Menu} from 'cx/ui/nav/Menu';
import {TextArea} from 'cx/ui/form/TextArea';
import {Button} from 'cx/ui/Button';
import {Md} from 'app/components/Md';
import {Task} from './Task';

import Controller from './Controller';

function filterItems(item, list) {
    return item.listId == list.id;
}

export default <cx>
    <div class="cxb-taskboard" controller={Controller}>
        <Repeater records:bind="lists" recordName="$list">
            <div class="cxb-tasklist">
                <div>
                    <h2 class="cxe-tasklist-header" text:bind="$list.name"></h2>
                    <Menu>
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
    </div>
</cx>;
