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
import Controller from './Controller';

export default <cx>
    <div class="cxb-settings" controller={Controller}>
        <h2>Settings</h2>
        <h3>GitHub</h3>
        <div visible:expr="{$page.gh.verified}">
            <p preserveWhitespace>
                Your tasks are persisted to <a href:tpl="https://gist.github.com/mstijak/{$page.gh.gistId}">this gist</a>.
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
                style="width: 30rem" />


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
    </div>
</cx>;
