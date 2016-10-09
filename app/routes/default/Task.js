import {VDOM, Widget} from 'cx/ui/Widget';

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
            edit: false
        };
    }

    render() {
        return <div className="cxb-task"
                    onClick={::this.onClick}
        >
            { this.state.edit && this.renderContent() }
            { !this.state.edit && this.renderEditor() }
        </div>
    }

    renderContent() {
        var {data} = this.props.instance;
        return data.task.name;
    }

    renderEditor() {
        var {data} = this.props.instance;
        return <textarea defaultValue={data.task.name} onChange={::this.onChange} />
    }

    onChange(e) {
        
    }

    onClick(e) {
        e.preventDefault();
        e.stopPropagation();

        this.setState({
            edit: !this.state.edit
        })
    }
}
