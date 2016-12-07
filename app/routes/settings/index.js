import { HtmlElement, Repeater, List, Text, Menu, TextField, TextArea, NumberField, Radio, Checkbox, LabeledContainer, Button, PureContainer } from 'cx/widgets';
import { LabelsLeftLayout, LabelsTopLayout, UseParentLayout } from 'cx/ui';
import {Md} from 'app/components/Md';
import Controller from './Controller';


export default <cx>
    <div class="cxb-settings" controller={Controller}>
        <h2>Settings</h2>

        <h3>GitHub</h3>
        <div visible:expr="{$page.gh.verified}">
            <p preserveWhitespace>
                Your tasks are persisted to the Gist
                <a href="https://gist.github.com" text:bind="$page.gh.gistId" />.
            </p>
            <p preserveWhitespace>
                <a href="#" onClick="unlink">Unlink completely</a>
                <a href="#" onClick="changeGist">Switch gists</a>
            </p>
        </div>
        <div layout={LabelsLeftLayout} visible:expr="!{$page.gh.verified}">
            <Md>
                GitHub gists can be used to store task data. In order to connect with GitHub please [create a GitHub Personal
                Access Token](https://github.com/settings/tokens) with **gist** scope and paste it below.
                The token will enable read/write access to your GitHub gists. Tokens are stored in **localStorage**, so don't do
                this on a public computer.
            </Md>

            <TextField
                value:bind="$page.gh.token"
                placeholder="GitHub Personal Access Token"
                label="Token"
                style="width: 30rem"
            />

            <LabeledContainer label="Gist">
                <Radio value:bind="$page.initMode" option="create" text="Create a new gist" />
                <Radio value:bind="$page.initMode" option="load" text="Load an existing gist"/>
            </LabeledContainer>

            <PureContainer layout={UseParentLayout} visible:expr="{$page.initMode}=='load'">
                <TextField
                    value:bind="$page.gh.gistId"
                    placeholder="Gist Identifier"
                    label="GistId"
                    style="width: 30rem" />
                <Button
                    onClick="load"
                    confirm="Loading the gist will remove all your locally stored tasks. Do you want to proceed?"
                >
                    Load
                </Button>
            </PureContainer>

            <PureContainer layout={UseParentLayout} visible:expr="{$page.initMode}=='create'">
                <Button onClick="create">
                    Create Gist
                </Button>
            </PureContainer>
        </div>

        <h3>Maintenance</h3>

        <div layout={LabelsLeftLayout}>
            <NumberField
                value:bind="tdo.settings.completedTasksRetentionDays"
                label="Show completed tasks for"
                style="width:5rem"
                inputStyle="text-align:center"
                help="day(s)."
            />
            <NumberField
                value:bind="tdo.settings.deleteCompletedTasksAfterDays"
                enabled:bind="tdo.settings.deleteCompletedTasks"
                style="width:5rem"
                inputStyle="text-align:center"
                label={<Checkbox value:bind="tdo.settings.deleteCompletedTasks">Delete completed tasks after</Checkbox>}
                help="day(s)"
            />
            <NumberField
                value:bind="tdo.settings.purgeDeletedObjectsAfterDays"
                label="Purge deleted objects after"
                style="width:5rem"
                inputStyle="text-align:center"
                help="day(s)"
            />
        </div>

        <h3>Task Styles</h3>

        <Repeater records:bind="tdo.settings.taskStyles">
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

        <TextArea value:bind="tdo.settings.css" rows={20} style="width:600px" />
    </div>
</cx>;
