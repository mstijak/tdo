import { HtmlElement, TextField, TextArea, Button } from "cx/widgets";
import { LabelsTopLayout } from "cx/ui";

export default <cx>
    <div class="cxb-listeditor">
        <div layout={{ type: LabelsTopLayout, mod: "stretch" }}>
            <TextField
                value-bind="$board.name"
                label="Name"
                autoFocus
                style="width:100%;"
            />
        </div>

        <br/>

        <div>
            <Button onClick="onMoveBoardLeft">Move Left</Button>
            <Button onClick="onMoveBoardRight" style="float:right">Move Right</Button>
        </div>

        <div layout={{ type: LabelsTopLayout, mod: "stretch" }}>
            <TextField
                value-bind="$board.headerClass"
                label="Header Class"
                placeholder="CSS class"
                style="width:100%;"
            />
        </div>

        <div layout={{ type: LabelsTopLayout, mod: "stretch" }}>
            <TextArea
                value-bind="$board.headerStyle"
                label="Header Style"
                placeholder="color, font-size, ..."
                reactOn="input"
                style="width:100%;"
            />
        </div>

        <div layout={{ type: LabelsTopLayout, mod: "stretch" }}>
            <TextField
                value-bind="$board.className"
                label="Board Class"
                placeholder="CSS class"
                style="width:100%;"
            />
        </div>

        <div layout={{ type: LabelsTopLayout, mod: "stretch" }}>
            <TextArea
                value-bind="$board.style"
                label="Board Style"
                placeholder="background, color, ..."
                reactOn="input"
                style="width:100%;"
            />
        </div>

        <br/>

        <div>
            <Button onClick="onSaveBoard">Save</Button>
            <Button
                mod="danger"
                confirm="All lists and tasks from this board will be deleted. Are you sure?"
                onClick="onDeleteBoard"
                style="float:right"
                text="Delete"
            />
        </div>
        <br/>
    </div>
</cx>;
