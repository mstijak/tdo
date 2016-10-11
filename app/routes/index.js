import {HtmlElement} from 'cx/ui/HtmlElement';
import Default from './default';
import Settings from './settings';
import {Tab} from 'cx/ui/nav/Tab';
import {TextField} from 'cx/ui/form/TextField';
import {Route} from 'cx/ui/nav/Route';
import {Sandbox} from 'cx/ui/Sandbox';


export default <cx>
    <div class="cxb-layout">
        <header class="cxe-layout-header">
            <h1>tdo</h1>
            <TextField value:bind="search.query" placeholder="Search..." mod="search" />
            <a href="#">Tasks</a>
            <a href="#settings">Settings</a>
            <a href="#keyboard">Keyboard Shortcuts</a>
            <a href="https://github.com/mstijak/tdo" target="_blank">Fork or report a problem</a>

        </header>
        <main class="cxe-layout-main">
            <Sandbox key:bind="hash" storage:bind="pages">
                <Route url:bind="hash" route="#">
                    <Default />
                </Route>
                <Route url:bind="hash" route="#settings">
                    <Settings />
                </Route>
            </Sandbox>
        </main>
    </div>
</cx>;
