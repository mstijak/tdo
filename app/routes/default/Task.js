import {VDOM, Widget} from 'cx/ui/Widget';
import marked from 'marked';
import {getStyles} from './styling';

export class Task extends Widget {

    init() {
        if (this.bind)
            this.task = {bind: this.bind};

        super.init();
    }

    declareData() {
        super.declareData(...arguments, {
            task: undefined,
            styles: undefined
        })
    }

    render(context, instance, key) {
        return <TaskCmp key={key} instance={instance}/>
    }
}


class TaskCmp extends VDOM.Component {

    constructor(props) {
        super(props);

        this.state = {
            edit: false,
            scrollHeight: null
        };

        this.dom = {};
    }

    render() {
        let {instance} = this.props;
        let {widget, data} = instance;
        let {CSS} = widget;

        let className = CSS.block("task", {}, {
            edit: this.state.edit,
            completed: !!data.task.completed
        });

        return <div className={className}
                    onKeyDown={::this.onKeyDown}
                    ref={el=> {
                        this.dom.el = el
                    }}
                    tabIndex={0}
                    onClick={::this.onClick}
                    onDoubleClick={e=>{this.toggleEditMode()}}>
            { !this.state.edit && this.renderContent() }
            { this.state.edit && this.renderEditor() }
        </div>
    }

    renderContent() {
        var {data, widget} = this.props.instance;
        var html = data.task.name ? marked(data.task.name) : '<p>&nbsp;</p>';

        var styles = getStyles(data.task.name, data.styles);

        return [
            <input key="check" type="checkbox"
                   checked={!!data.task.completed}
                   onChange={::this.onCheck}
                   tabIndex={-1}
                   onClick={e=> {
                       e.preventDefault();
                       e.stopPropagation();
                   }}/>,
            <div key="content"
                 className={widget.CSS.expand("cxe-task-content", styles.className)}
                 style={styles.style}
                 dangerouslySetInnerHTML={{__html: html}}
            />]
    }

    renderEditor() {
        var {data} = this.props.instance;
        var style = {};
        if (this.state.scrollHeight) {
            style.height = `${this.state.scrollHeight}px`;
        }
        return <textarea defaultValue={data.task.name}
                         onMouseDown={e=>{e.stopPropagation();}}
                         onKeyDown={::this.onEditorKeyDown}
                         ref={c=> {
                             this.dom.editor = c;
                         }}
                         style={style}
                         rows={1}
                         onBlur={::this.onEditorBlur}
                         onChange={::this.onChange}
        />
    }

    onCheck(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setCompleted(e.target.checked);
    }

    setCompleted(completed = true) {
        let {instance} = this.props;
        let {data} = instance;

        instance.set('task', {
            ...data.task,
            completed: completed,
            completedDate: new Date().toISOString()
        });
    }

    onKeyDown(e) {
        let {instance} = this.props;
        let {data, widget} = instance;

        switch (e.keyCode) {
            case 13:
            case 69:
            case 65:
                e.stopPropagation();
                e.preventDefault()
                this.toggleEditMode();
                break;

            case 32:
            case 88:
                this.setCompleted(!data.task.completed);
                break;

            default:
                if (widget.onKeyDown)
                    widget.onKeyDown(e, instance);
                break;
        }
    }

    save(e) {
        let {instance} = this.props;
        let {data} = instance;

        var task = {
            ...data.task,
            name: e.target.value,
            lastChange: new Date().toISOString()
        };

        delete task.isNew;

        instance.set('task', task);
    }

    onEditorKeyDown(e) {
        let {instance} = this.props;
        let {data} = instance;

        switch (e.keyCode) {
            case 13:
                e.stopPropagation();
                if (e.ctrlKey) {
                    this.save(e);
                    this.toggleEditMode();
                }
                break;

            case 27:
                this.save(e);
                this.toggleEditMode();
                break;

            default:
                e.stopPropagation()
                break;
        }
    }

    onEditorBlur(e) {
        this.save(e);
        this.setState({
            edit: false
        });
    }

    onChange(e) {
        this.componentDidUpdate();
    }

    onClick(e) {
        e.preventDefault();
        e.stopPropagation();

        //this.toggleEditMode();
    }

    toggleEditMode() {
        var change = {
            edit: !this.state.edit
        };

        if (change.edit)
            change.scrollHeight = null;

        this.setState(change, () => {
            if (this.state.edit)
                this.dom.editor.focus();
            else
                this.dom.el.focus();
        })
    }

    componentDidMount() {
        this.props.instance.parent.toggleEditMode = ::this.toggleEditMode;
        let {instance} = this.props;
        let {store, data} = instance;

        if (this.dom.el.parentNode.parentNode.parentNode.contains(document.activeElement))
            this.toggleEditMode();

        if (data.task.id == store.get('activeTaskId'))
            setTimeout(()=> {
                this.dom.el.focus();
            }, 10);
    }

    componentDidUpdate() {
        if (this.state.edit) {
            this.dom.editor.style.width = `${this.dom.editor.scrollWidth}px`;
            if (this.dom.editor.scrollHeight > this.dom.editor.offsetHeight) {
                this.setState({
                    scrollHeight: Math.ceil(this.dom.editor.scrollHeight)
                });
            }
        }
    }
}
