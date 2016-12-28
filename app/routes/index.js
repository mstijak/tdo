import { HtmlElement, Tab, TextField, Route, Menu, MenuItem, Submenu, Sandbox, Repeater, PureContainer } from 'cx/widgets';
import { FirstVisibleChildLayout } from 'cx/ui';











import Default from './default';
import Settings from './settings';
import Help from './help';
import Controller from './Controller';

const BoardItems = <cx>
    <PureContainer>
        <Repeater
            records:bind="tdo.boards"
            filter={b => !b.deleted}
        >
            <MenuItem
                mod={{
                    active: {expr: '{hash}=="#" + {$record.id}'},
                    test: true
                }}
                pad
            >
                <a href:tpl="#{$record.id}"
                   className:bind="$record.headerClass"
                   style:bind="$record.headerStyle"
                   text:bind="$record.name"
                />
            </MenuItem>
        </Repeater>

        <MenuItem pad>
            <a href="#" onClick="addBoard">Add Board</a>
        </MenuItem>

        <div class="spacer" visible:expr="{layout.mode}=='desktop'"/>
        <hr visible:expr="{layout.mode}=='phone'"/>
    </PureContainer>
</cx>;

const MenuItems = <cx>
    <PureContainer>
        <MenuItem mod={{active: {expr: '{hash}=="#settings"'}}} pad>
            <a href="#settings">
                Settings
            </a>
        </MenuItem>

        <MenuItem mod={{active: {expr: '{hash}=="#help"'}}} pad>
            <a href="#help">
                Help <code>?</code>
            </a>
        </MenuItem>

        <div class="spacer" visible:expr="{layout.mode}=='desktop'"/>
        <hr visible:expr="{layout.mode}!='desktop'"/>

        <MenuItem pad>
            <a href="https://github.com/mstijak/tdo" target="_blank">Report/Suggest</a>
        </MenuItem>

        <MenuItem pad>
            <a href={`http://twitter.com/home?status=${encodeURIComponent("tdo - hackable todo list #todo https://goo.gl/rhkuYP")}`}
               target="_blank">Tweet</a>
        </MenuItem>
    </PureContainer>
</cx>;

export default <cx>
    <div class="cxb-layout" controller={Controller}>
        <style innerHtml:bind="tdo.settings.css"/>
        <Sandbox key:bind="hash" storage:bind="pages" immutable>
            <header class="cxe-layout-header">
                <h1>tdo</h1>
                <TextField value:bind="search.query" placeholder="Search..." mod="search" id="search" autoFocus/>

                <Menu horizontal>
                    <BoardItems visible:expr="{layout.mode}=='desktop' || {layout.mode}=='tablet'" />
                    <MenuItems visible:expr="{layout.mode}=='desktop'" />
                    <MenuItem visible:expr="{layout.mode}!='desktop'">
                        <Submenu>
                            &#9776;
                            <Menu putInto="dropdown">
                                <BoardItems visible:expr="{layout.mode}=='phone'" />
                                <MenuItems />
                            </Menu>
                        </Submenu>
                    </MenuItem>
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
