import {HtmlElement} from 'cx/ui/HtmlElement';
import {TextField} from 'cx/ui/form/TextField';
import {Button} from 'cx/ui/Button';
import {LabelsTopLayout} from 'cx/ui/layout/LabelsTopLayout';

export default <cx>
    <div>
        <div layout={LabelsTopLayout}>
            <TextField value:bind="$list.name" label="Name" />
        </div>

        <br/>

        <Button onClick={(e, {store}) => { store.delete('$list.edit')}}>Save</Button>
        <Button mod="danger" confirm="Are you sure?" onClick="deleteList">Delete</Button>
    </div>
</cx>
