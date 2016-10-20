import {HtmlElement} from 'cx/ui/HtmlElement';
import {Repeater} from 'cx/ui/Repeater';
import {List} from 'cx/ui/List';
import {Menu} from 'cx/ui/nav/Menu';
import {TextField} from 'cx/ui/form/TextField';
import {Radio} from 'cx/ui/form/Radio';
import {LabeledContainer} from 'cx/ui/form/LabeledContainer';
import {Button} from 'cx/ui/Button';
import {PureContainer} from 'cx/ui/PureContainer';
import {LabelsLeftLayout} from 'cx/ui/layout/LabelsLeftLayout';
import {UseParentLayout} from 'cx/ui/layout/UseParentLayout';
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

            `Enter` or `e` Edit task at cursor position

            `Space` or `x` Mark task as completed

            `Insert` or `i` Insert task at cursor position

            `o` Insert task below cursor position

            `Delete` or `Shift` + `D` Delete task

            `Escape` or `Ctrl` + `Enter` Exit task edit mode

            -----------

            `Ctrl` + `Left` Move task to the previous list

            `Ctrl` + `Right` Move task to the next list

            `Ctrl` + `Up` Move task up

            `Ctrl` + `Down` Move task down


        </Md>
    </div>
</cx>;
