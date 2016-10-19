import {HtmlElement} from 'cx/ui/HtmlElement';
import {TextField} from 'cx/ui/form/TextField';
import {TextArea} from 'cx/ui/form/TextArea';
import {Button} from 'cx/ui/Button';
import {LabelsTopLayout} from 'cx/ui/layout/LabelsTopLayout';

export default <cx>
    <div class="cxb-listeditor">
        <div layout={{ type: LabelsTopLayout, mod: 'stretch' }}>
            <TextField
                value:bind="$board.name"
                label="Name"
                autoFocus
                style="width:100%;"
            />
        </div>

        <br/>

        <div>
            <Button onClick="boardMoveLeft">Move Left</Button>
            <Button onClick="boardMoveRight" style="float:right">Move Right</Button>
        </div>

        <div layout={{ type: LabelsTopLayout, mod: 'stretch' }}>
            <TextField
                value:bind="$board.headerClass"
                label="Header Class"
                placeholder="CSS class"
                style="width:100%;"
            />
        </div>

        <div layout={{ type: LabelsTopLayout, mod: 'stretch' }}>
            <TextArea
                value:bind="$board.headerStyle"
                label="Header Style"
                placeholder="color, font-size, ..."
                reactOn="input"
                style="width:100%;"
            />
        </div>

        <div layout={{ type: LabelsTopLayout, mod: 'stretch' }}>
            <TextField
                value:bind="$board.className"
                label="Board Class"
                placeholder="CSS class"
                style="width:100%;"
            />
        </div>

        <div layout={{ type: LabelsTopLayout, mod: 'stretch' }}>
            <TextArea
                value:bind="$board.style"
                label="Board Style"
                placeholder="background, color, ..."
                reactOn="input"
                style="width:100%;"
            />
        </div>

        <br/>

        <div>
            <Button onClick={(e, {store}) => { store.delete('$board.edit')}}>Save</Button>
            <Button mod="danger" confirm="All lists and tasks from this board will be deleted. Are you sure?" onClick="deleteBoard" style="float:right">Delete</Button>
        </div>
        <br/>
    </div>
</cx>
