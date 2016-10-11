import {HtmlElement} from 'cx/ui/HtmlElement';
import Default from './default';
import Settings from './settings';
import {Tab} from 'cx/ui/nav/Tab';
import {Route} from 'cx/ui/nav/Route';
import {Sandbox} from 'cx/ui/Sandbox';


export default <cx>
    <div class="cxb-layout">
        <header class="cxe-layout-header">
            <h1>tdo</h1>
            <a href="#">Tasks</a>
            <a href="#settings">Settings</a>
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
