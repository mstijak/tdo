import { HtmlElement, TextField, TextArea, LookupField, Button } from 'cx/widgets';
import { LabelsTopLayout } from 'cx/ui';







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

        <div layout={{ type: LabelsTopLayout, mod: 'stretch' }}>
            <LookupField
                value:bind="$list.boardId"
                label="Board"
                options:bind="tdo.boards"
                optionTextField="name"
                style="width:100%;"
                required
            />
        </div>

        <br/>

        <div>
            <Button onClick="listMoveLeft">Move Left</Button>
            <Button onClick="listMoveRight" style="float:right">Move Right</Button>
        </div>

        <div layout={{ type: LabelsTopLayout, mod: 'stretch' }}>
            <TextField
                value:bind="$list.headerClass"
                label="Header Class"
                placeholder="CSS class"
                style="width:100%;"
            />
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
            <TextField
                value:bind="$list.className"
                label="List Class"
                placeholder="CSS class"
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
