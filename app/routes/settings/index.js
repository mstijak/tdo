import {Repeater, TextField, TextArea, NumberField, Checkbox, Button, PureContainer, LinkButton} from 'cx/widgets';
import { LabelsLeftLayout, LabelsTopLayout } from 'cx/ui';
import Controller from './Controller';


export default <cx>
    <div class="cxb-settings" controller={Controller}>
        <h2>Settings</h2>

        <h3>Account</h3>
        <div visible-expr="{user.anonymous}">
            <p ws>
                Your data is saved to the database using a temporary user account.
                You may loose access if you clear the local storage data from your browser.
                Please sign in to use the application on multiple devices or browsers.
            </p>
            <a onClick="signInWithGoogle" href="#">Sign in with Google</a>
        </div>
        <div visible-expr="!{user.anonymous}">
            <p ws>
                You are signed in as <strong text-tpl="{user.displayName} ({user.email})" />.
            </p>
            <a onClick="signOut" href="#">Sign Out</a>
        </div>


        <h3>Maintenance</h3>

        <div layout={LabelsLeftLayout}>
            <NumberField
                value:bind="settings.deleteCompletedTasksAfterDays"
                enabled:bind="settings.deleteCompletedTasks"
                style="width:5rem"
                inputStyle="text-align:center"
                label={<Checkbox value:bind="settings.deleteCompletedTasks">Delete completed tasks after</Checkbox>}
                help="day(s)"
            />
            <NumberField
                value:bind="settings.purgeDeletedObjectsAfterDays"
                label="Purge deleted objects after"
                style="width:5rem"
                inputStyle="text-align:center"
                help="day(s)"
            />
        </div>

        <h3>Task Styles</h3>

        <Repeater records:bind="settings.taskStyles">
            <PureContainer layout={LabelsTopLayout}>
                <span text:tpl="{[{$index}+1]}." />
                <TextField value:bind="$record.regex" label="Regex" />
                <TextField value:bind="$record.style" label="Style" />
                <TextField value:bind="$record.className" label="Class" />
                <a href="#" onClick="removeTaskStyle">Remove</a>
            </PureContainer>
        </Repeater>
        <p>
            <a href="#" onClick="addTaskStyle">Add</a>
        </p>

        <h3>Custom CSS</h3>

        <TextArea value:bind="settings.css" rows={20} style="width:600px" />
    </div>
</cx>;
