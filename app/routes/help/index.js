import { HtmlElement, Repeater, List, Menu, TextField, Radio, LabeledContainer, Button, PureContainer } from 'cx/widgets';
import { LabelsLeftLayout, UseParentLayout } from 'cx/ui';
import {Md} from 'app/components/Md';

export default <cx>
    <div class="cxb-help">
        <Md>
            ## Help

            Use double-click to edit lists and tasks.

            ### Keyboard Shortcuts (Windows)

            `Up` or `k` Move cursor to the previous task

            `Down` or `j` Move cursor to the next task

            `Left` or `h` Move cursor to the previous list

            `Right` or `l` Move cursor to the next list

            `Enter` or `i` Edit task at cursor position

            `Space` or `x` Mark task as completed

            `/` Search

            `o` Insert task below cursor position

            `Insert` or `Shift` + `O` Insert task at cursor position

            `Delete` or `Shift` + `D` Delete task

            `Escape` or `Ctrl` + `Enter` Exit task edit mode

            `Escape` (when cursor is not in a task list) Move cursor to the first task list

            -----------

            `Ctrl` + `Left` Move task to the previous list

            `Ctrl` + `Right` Move task to the next list

            `Ctrl` + `Up` Move task up

            `Ctrl` + `Down` Move task down


        </Md>
    </div>
</cx>;
