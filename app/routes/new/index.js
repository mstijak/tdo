import Controller from "./Controller";
import templates from "./templates";
import {Menu, MenuItem} from "cx/widgets";
import {Repeater} from "cx/ui";

export default (
    <cx>
        <Menu controller={Controller} class="boardtemplates" horizontal autoFocus>
            <Repeater records={templates}>
                <MenuItem class="boardtemplate" onClick="addBoard">
                    <img class="boardtemplate_img" src-bind="$record.thumbUrl"/>
                    <div class="boardtemplate_info">
                        <div class="boardtemplate_name" text-bind="$record.name" />
                        <div class="boardtemplate_desc" text-bind="$record.description  " />
                    </div>
                </MenuItem>
            </Repeater>
        </Menu>
    </cx>
);
