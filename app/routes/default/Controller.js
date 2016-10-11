import {Controller} from 'cx/ui/Controller';
import {append} from 'cx/data/ops/append';
import {KeyCode} from 'cx/util/KeyCode';
import {Gists} from '../../services/Gists';

import uid from 'uid';

export default class extends Controller {
    init() {
        super.init();

        this.load();

        this.addTrigger('persist', ['lists', 'tasks'], ::this.persist);
    }

    persist() {
        var {tasks, lists} = this.store.getData();

        var gh = localStorage.gh && JSON.parse(localStorage.gh);

        if (gh && gh.token && gh.gistId) {
            let gists = new Gists(gh);
            gists.update({
                lists,
                tasks
            })
        }
        else {
            localStorage.tasks = JSON.stringify(tasks);
            localStorage.lists = JSON.stringify(lists);
        }
    }

    load() {
        var gh = localStorage.gh && JSON.parse(localStorage.gh);
        if (gh && gh.token && gh.gistId) {
            let gists = new Gists(gh);
            this.store.set('$page.status', 'loading');
            gists.load()
                .then(x=> {
                    this.store.set('tasks', x.tasks || []);
                    this.store.set('lists', x.lists || []);
                    this.store.set('$page.status', 'ok');
                })
                .catch(e=> {
                    console.log(e);
                    this.store.set('$page.status', 'error');
                });
        }
        else {
            this.store.set('tasks', localStorage.tasks && JSON.parse(localStorage.tasks) || []);
            this.store.set('lists', localStorage.lists && JSON.parse(localStorage.lists) || []);
            if (this.store.get('lists').length == 0)
                this.addList();
        }
    }

    onItemClick(e, instance) {
        instance.toggleEditMode();
    }

    addList(e) {
        if (e)
            e.preventDefault();

        this.store.update('lists', append, {
            id: uid(),
            name: 'New List',
            edit: true,
            created: new Date().toISOString()
        });
    }

    deleteList(e, {store}) {
        var l = store.get('$list');
        this.store.update('lists', lists => lists.filter(x=>x != l));
    }

    prepareTask(listId) {
        return  {
            id: uid(),
            listId,
            created: new Date().toISOString()
        }
    }

    addTask(e, {store}) {
        var listId = store.get('$list.id');
        this.store.update('tasks', append, this.prepareTask(listId));
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
                let nt = this.prepareTask(t.listId);
                this.store.set('tasks', [...tasks.slice(0, index), nt, ...tasks.slice(index)]);
                break;
        }
    }

    listMoveLeft(e, {store}) {
        var {lists, $list} = store.getData();
        var index = lists.indexOf($list);
        if (index > 0) {
            store.set('lists', [
                ...lists.slice(0, index - 1),
                $list,
                lists[index - 1],
                ...lists.slice(index + 1)
            ]);
        }
    }

    listMoveRight(e, {store}) {
        var {lists, $list} = store.getData();
        var index = lists.indexOf($list);
        if (index + 1 < lists.length) {
            store.set('lists', [
                ...lists.slice(0, index),
                lists[index + 1],
                $list,
                ...lists.slice(index + 2)
            ]);
        }
    }
}
