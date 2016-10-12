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

            General rule is that double-click is used to switch to edit mode (lists and tasks).

            ### Keyboard Shortcuts (Windows)

            `Up` Move cursor to the previous task

            `Down` Move cursor to the next task

            `Left` Move cursor to the previous list

            `Right` Move cursor to the next list

            `Enter` Edit task at cursor position

            `Space` Mark task as completed

            `Insert` Insert task at cursor position

            `Delete` Delete task

            -----------

            `Ctrl` + `Left` Move task to the previous list

            `Ctrl` + `Right` Move task to the next list

            `Ctrl` + `Up` Move task up

            `Ctrl` + `Down` Move task down


        </Md>
    </div>
</cx>;
