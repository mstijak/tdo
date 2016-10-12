import {HtmlElement} from 'cx/ui/HtmlElement';
import {TextField} from 'cx/ui/form/TextField';
import {TextArea} from 'cx/ui/form/TextArea';
import {Button} from 'cx/ui/Button';
import {LabelsTopLayout} from 'cx/ui/layout/LabelsTopLayout';

export default <cx>
    <div class="cxb-listeditor">
        <div layout={{ type: LabelsTopLayout, mod: 'stretch' }}>
            <TextField
                value:bind="$list.name"
                label="Name"
                autoFocus
                style="width:100%;"
            />
        </div>

        <br/>

        <div>
            <Button onClick="listMoveLeft">Move Left</Button>
            <Button onClick="listMoveRight" style="float:right">Move Right</Button>
        </div>

        <div layout={{ type: LabelsTopLayout, mod: 'stretch' }}>
            <TextArea
                value:bind="$list.headerStyle"
                label="Header Style"
                placeholder="color"
                reactOn="input"
                style="width:100%;"
            />
        </div>

        <div layout={{ type: LabelsTopLayout, mod: 'stretch' }}>
            <TextArea
                value:bind="$list.listStyle"
                label="List Style"
                placeholder="width, background"
                reactOn="input"
                style="width:100%;"
            />
        </div>

        <br/>

        <div>
        <Button onClick={(e, {store}) => { store.delete('$list.edit')}}>Save</Button>
        <Button mod="danger" confirm="Are you sure?" onClick="deleteList" style="float:right">Delete</Button>
        </div>
        <br/>
    </div>
</cx>
