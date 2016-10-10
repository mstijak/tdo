import {HtmlElement} from 'cx/ui/HtmlElement';
import {Repeater} from 'cx/ui/Repeater';
import {List} from 'cx/ui/List';
import {Menu} from 'cx/ui/nav/Menu';
import {TextField} from 'cx/ui/form/TextField';
import {Button} from 'cx/ui/Button';
import {Md} from 'app/components/Md';

export default <cx>
    <div class="cxb-github">
        <h2>GitHub</h2>
        <p>GitHub gists may be used to store task data.</p>
        GitHub
        <TextField value:bind="github.accessToken" placeholder="GitHub personal access token"/>
    </div>
</cx>;
