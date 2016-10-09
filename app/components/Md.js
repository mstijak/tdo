import marked from 'marked';

import {HtmlElement} from 'cx/ui/HtmlElement';

export class Md extends HtmlElement {

    declareData() {
        super.declareData(...arguments, {
            source: undefined
        })
    }

    prepareData(context, instance) {
        var {data} = instance;
        if (data.source)
            data.innerHtml = marked(data.source);

        super.prepareData(context, instance)
    }

    isValidHtmlAttribute(attrName) {
        if (attrName == 'source')
            return false;
        return super.isValidHtmlAttribute(attrName);
    }
}



