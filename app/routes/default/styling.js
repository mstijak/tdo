import {parseStyle} from 'cx/util/parseStyle';

var styles = -1, rules;

export function getStyles(text, taskStyles) {
    if (styles !== taskStyles) {
        rules = [];
        if (Array.isArray(taskStyles)) {
            taskStyles.forEach(s=> {
                try {
                    if (s.regex && (s.style || s.className)) {
                        var rule = {
                            regex: new RegExp(s.regex),
                            style: parseStyle(s.style),
                            className: s.className
                        };
                        rules.push(rule);
                    }
                } catch (e) {
                    console.log('Task style error.', e);
                }
            });
        }
    }

    var result = {
        style: {},
        className: []
    };

    if (text) {
        for (var i = 0; i < rules.length; i++) {
            if (text.match(rules[i].regex)) {
                Object.assign(result.style, rules[i].style);
                if (rules[i].className)
                    result.className.push(rules[i].className);
            }
        }
    }

    return result;
}
