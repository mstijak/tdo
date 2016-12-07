import { HtmlElement } from 'cx/widgets';
import marked from 'marked';
import {removeCommonIndent} from './removeCommonIndent';


export class Md extends HtmlElement {

    declareData() {
        super.declareData(...arguments, {
            source: undefined
        })
    }

    prepareData(context, instance) {
        var {data} = instance;

        if (data.source || this.content) {
            data.source = removeCommonIndent(data.source || this.content);
            data.innerHtml = marked(data.source);
        }

        super.prepareData(context, instance)
    }

    isValidHtmlAttribute(attrName) {
        if (attrName == 'source')
            return false;
        return super.isValidHtmlAttribute(attrName);
    }

    add(x) {

        if (Array.isArray(x))
            x.forEach(t=>this.add(t));

        if (typeof x != 'string')
            return;

        this.content += x;
    }
}

Md.prototype.trimWhitespace = false;
Md.prototype.content = '';

