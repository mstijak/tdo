import {HtmlElement} from 'cx/ui/HtmlElement';
import {Repeater} from 'cx/ui/Repeater';
import {List} from 'cx/ui/List';
import {Menu} from 'cx/ui/nav/Menu';
import {TextField} from 'cx/ui/form/TextField';
import {Button} from 'cx/ui/Button';
import {LabelsLeftLayout} from 'cx/ui/layout/LabelsLeftLayout';
import {Md} from 'app/components/Md';
import Controller from './Controller';

export default <cx>
    <div class="cxb-github" controller={Controller}>
        <Md>
            ### GitHub

            GitHub gists can be used to store task data. In order to connect with GitHub please [create a GitHub Personal
            Access Token](https://github.com/settings/tokens) with **gist** scope and paste it below.
            The token will enable read/write access to your GitHub gists. Tokens are stored in **localStorage**, so don't do
            this on a public computer.
        </Md>
        <div layout={LabelsLeftLayout}>
            <TextField
                value:bind="$page.gh.token"
                placeholder="GitHub Personal Access Token"
                label="Token"
                style="width: 30rem" />
            <TextField
                value:bind="$page.gh.gistId"
                placeholder="Gist Identifier"
                label="GistId"
                style="width: 30rem" />
            <Button onClick="sync">
                Sync
            </Button>
        </div>
    </div>
</cx>;
