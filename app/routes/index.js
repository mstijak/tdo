import {HtmlElement} from 'cx/ui/HtmlElement';
import {Tab} from 'cx/ui/nav/Tab';
import {TextField} from 'cx/ui/form/TextField';
import {Route} from 'cx/ui/nav/Route';
import {Sandbox} from 'cx/ui/Sandbox';

import Default from './default';
import Settings from './settings';
import Help from './help';


export default <cx>
    <div class="cxb-layout">
        <header class="cxe-layout-header">
            <h1>tdo</h1>
            <TextField value:bind="search.query" placeholder="Search..." mod="search" />
            <a href="#" class={{active: {expr: '{hash}=="#"'}}}>Tasks</a>
            <a href="#settings" class={{active: {expr: '{hash}=="#settings"'}}}>Settings</a>
            <a href="#help" class={{active: {expr: '{hash}=="#help"'}}}>Help</a>

            <div class="spacer" />

            <a href="https://github.com/mstijak/tdo" target="_blank">Report/Suggest</a>
            <a href={`http://twitter.com/home?status=${encodeURIComponent("tdo - hackable todo list #todo https://goo.gl/rhkuYP")}`} target="_blank">Tweet</a>
        </header>
        <main class="cxe-layout-main">
            <Sandbox key:bind="hash" storage:bind="pages">
                <Route url:bind="hash" route="#">
                    <Default />
                </Route>
                <Route url:bind="hash" route="#settings">
                    <Settings />
                </Route>
                <Route url:bind="hash" route="#help">
                    <Help />
                </Route>
            </Sandbox>
        </main>
    </div>
</cx>;
