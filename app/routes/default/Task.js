import {VDOM, Widget} from 'cx/ui/Widget';
import marked from 'marked';

export class Task extends Widget {

    init() {
        if (this.bind)
            this.task = {bind: this.bind};

        super.init();
    }

    declareData() {
        super.declareData(...arguments, {
            task: undefined
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
            editorRows: 1
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
        var {data} = this.props.instance;
        var html = data.task.name ? marked(data.task.name) : '<p>&nbsp;</p>';

        return [
            <input key="check" type="checkbox"
                   checked={!!data.task.completed}
                   onChange={::this.onCheck}
                   tabIndex={-1}
                   onClick={e=> {
                       e.preventDefault();
                       e.stopPropagation();
                   }}/>,
            <div className="cxe-task-content" key="content" dangerouslySetInnerHTML={{__html: html}}/>]
    }

    renderEditor() {
        var {data} = this.props.instance;
        return <textarea defaultValue={data.task.name}
                         onClick={e=>e.stopPropagation()}
                         onKeyDown={::this.onEditorKeyDown}
                         ref={c=> {
                             this.dom.editor = c;
                         }}
                         rows={this.state.editorRows}
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
            completed: completed
        });
    }

    onKeyDown(e) {
        let {instance} = this.props;
        let {data, widget} = instance;

        switch (e.keyCode) {
            case 13:
                e.stopPropagation();
                e.preventDefault()
                this.toggleEditMode();
                break;

            case 32:
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

        instance.set('task', {
            ...data.task,
            name: e.target.value
        });
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
        this.setState({
            edit: !this.state.edit
        }, () => {
            if (this.state.edit)
                this.dom.editor.focus();
            else
                this.dom.el.focus();
        })
    }

    componentDidMount() {
        this.props.instance.parent.toggleEditMode = ::this.toggleEditMode;
        let {instance} = this.props;
        let {data} = instance;

        if (this.dom.el.parentNode.parentNode.parentNode.contains(document.activeElement))
            this.toggleEditMode();
    }

    componentDidUpdate() {
        if (this.state.edit) {
            this.dom.editor.style.width = `${this.dom.editor.scrollWidth}px`;
            if (this.dom.editor.scrollHeight > this.dom.editor.offsetHeight)
                this.setState({
                    editorRows: this.state.editorRows + 1
                });
        }
    }
}
