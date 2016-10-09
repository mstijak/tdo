import {HtmlElement} from 'cx/ui/HtmlElement';
import {Repeater} from 'cx/ui/Repeater';
import {List} from 'cx/ui/List';
import {TextArea} from 'cx/ui/form/TextArea';
import {Md} from 'app/components/Md';
import {Task} from './Task';

import Controller from './Controller';

export default <cx>
    <div class="cxb-taskboard" controller={Controller}>
        <Repeater records:bind="lists" recordName="$list">
            <div class="cxb-tasklist">
                <h2 class="cxe-tasklist-header" text:bind="$list.name"></h2>
                <List records:bind="tasks" recordName="$task" itemPad={false} onItemClick="onItemClick">
                    <Task bind="$task" />
                </List>
            </div>
        </Repeater>
    </div>
</cx>;
