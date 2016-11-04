import {HtmlElement} from 'cx/ui/HtmlElement';
import {Tab} from 'cx/ui/nav/Tab';
import {TextField} from 'cx/ui/form/TextField';
import {Route} from 'cx/ui/nav/Route';
import {Menu, MenuItem} from 'cx/ui/nav/Menu';
import {Sandbox} from 'cx/ui/Sandbox';
import {Repeater} from 'cx/ui/Repeater';
import {FirstVisibleChildLayout} from 'cx/ui/layout/FirstVisibleChildLayout';

import Default from './default';
import Settings from './settings';
import Help from './help';
import Controller from './Controller';

export default <cx>
    <div class="cxb-layout" controller={Controller}>
        <style innerHtml:bind="tdo.settings.css" />
        <Sandbox key:bind="hash" storage:bind="pages" immutable>
            <header class="cxe-layout-header">
                <h1>tdo</h1>
                <TextField value:bind="search.query" placeholder="Search..." mod="search" id="search" autoFocus />

                <Menu horizontal>
                    <Repeater
                        records:bind="tdo.boards"
                        filter={b=>!b.deleted}
                    >
                        <MenuItem
                            mod={{
                                active: {expr: '{hash}=="#" + {$record.id}'},
                                test: true
                            }}
                        >
                            <a href:tpl="#{$record.id}"
                               class="cxm-menu-pad"
                               className:bind="$record.headerClass"
                               style:bind="$record.headerStyle"
                               text:bind="$record.name"
                            />
                        </MenuItem>
                    </Repeater>
                    <a href="#" onClick="addBoard" class="cxm-menu-pad">Add Board</a>

                    <div class="spacer"/>

                    <MenuItem mod={{ active: {expr: '{hash}=="#settings"'}}}>
                        <a href="#settings" class="cxm-menu-pad">
                            Settings
                        </a>
                    </MenuItem>

                    <MenuItem mod={{ active: {expr: '{hash}=="#help"'}}}>
                        <a href="#help" class="cxm-menu-pad">
                            Help <code>?</code>
                        </a>
                    </MenuItem>

                    <div class="spacer"/>

                    <a href="https://github.com/mstijak/tdo" class="cxm-menu-pad" target="_blank">Report/Suggest</a>
                    <a href={`http://twitter.com/home?status=${encodeURIComponent("tdo - hackable todo list #todo https://goo.gl/rhkuYP")}`}
                       class="cxm-menu-pad"
                       target="_blank">Tweet</a>
                </Menu>
            </header>
            <main class="cxe-layout-main" layout={FirstVisibleChildLayout}>
                <Route url:bind="hash" route="#settings">
                    <Settings />
                </Route>
                <Route url:bind="hash" route="#help">
                    <Help />
                </Route>
                <Route url:bind="hash" route="#(:boardId)">
                    <Default />
                </Route>
            </main>
        </Sandbox>
    </div>
</cx>;
