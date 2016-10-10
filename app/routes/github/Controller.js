import {Controller} from 'cx/ui/Controller';
import {append} from 'cx/data/ops/append';
import {KeyCode} from 'cx/util/KeyCode';
import uid from 'uid';

export default class extends Controller {
    init() {
        super.init();

        this.loadLists();
        this.addTrigger('lists', ['lists'], (lists) => {
            localStorage['lists'] = JSON.stringify(lists, null, 2);
        });

        this.loadTasks();
        this.addTrigger('tasks', ['tasks'], (tasks) => {
            localStorage['tasks'] = JSON.stringify(tasks, null, 2);
        });
    }

    loadLists() {
        var lists = localStorage['lists'];
        if (lists) {
            this.store.set('lists', JSON.parse(lists));
        } else {
            this.store.set('lists', [{
                id: uid(),
                name: 'List 1'
            }]);
        }
    }

    loadTasks() {
        var tasks = localStorage['tasks'];
        if (tasks) {
            this.store.set('tasks', JSON.parse(tasks));
        }
        else {
            this.store.set('tasks', []);
        }
    }

    onItemClick(e, instance) {
        instance.toggleEditMode();
    }

    addList(e) {
        e.preventDefault();

        this.store.update('lists', append, {
            id: uid(),
            name: 'New List',
            edit: true
        });
    }

    deleteList(e, {store}) {
        var l = store.get('$list');
        this.store.update('lists', lists => lists.filter(x=>x != l));
    }

    addTask(e, {store}) {
        var listId = store.get('$list.id');
        this.store.update('tasks', append, {
            id: uid(),
            listId
        });
        e.preventDefault();
    }

    onTaskKeyDown(e, instance) {
        let t = instance.data.task;
        let tasks = this.store.get('tasks');

        switch (e.keyCode) {
            case KeyCode.delete:
                this.store.update('tasks', tasks => tasks.filter(x=>x != t));
                break;

            case KeyCode.insert:
                let index = tasks.indexOf(t);
                let nt = {
                    id: uid(),
                    listId: t.listId
                };
                this.store.set('tasks', [...tasks.slice(0, index), nt, ...tasks.slice(index)]);
                break;
        }
    }
}
