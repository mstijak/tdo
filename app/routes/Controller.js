import {Controller} from 'cx/ui/Controller';
import {Gists} from '../services/Gists';
import {migrate} from '../data/migrate';
import {append} from 'cx/data/ops/append';
import uid from 'uid';

export default class extends Controller {
    init() {
        super.init();

        if (!this.store.get('tdo'))
            this.load();

        this.addTrigger('persist', ['tdo'], ::this.persist);
    }

    load() {
        var gh = localStorage.gh && JSON.parse(localStorage.gh);
        if (gh && gh.token && gh.gistId) {
            let gists = new Gists(gh);
            this.store.set('$page.status', 'loading');
            gists.load()
                .then(x=> {
                    migrate(x);
                    this.store.set('tdo', x);
                    this.store.set('$page.status', 'ok');
                    this.gotoFirstBoard();
                })
                .catch(e=> {
                    console.log(e);
                    this.store.set('$page.status', 'error');
                });
        }
        else {
            let data = localStorage.tdo && JSON.parse(localStorage.tdo) || this.getDefaultData();
            migrate(data);
            this.store.set('tdo', data);
            this.gotoFirstBoard();
        }
    }

    persist() {
        var {tdo} = this.store.getData();

        var gh = localStorage.gh && JSON.parse(localStorage.gh);

        if (gh && gh.token && gh.gistId) {
            if (this.saveTaskId)
                clearTimeout(this.saveTaskId);
            this.saveTaskId = setTimeout(()=> {
                delete this.saveTaskId;
                let gists = new Gists(gh);
                gists.update(tdo);
            }, 5000);
        }
        else {
            localStorage.tdo = JSON.stringify(tdo);
        }
    }

    addBoard(e, {store}) {
        e.preventDefault();
        var board = {
            id: uid(),
            name: 'New Board',
            createdDate: new Date().toISOString(),
            edit: true
        };
        store.update('tdo.boards', append, board);
        window.location.hash = '#' + board.id;
    }

    gotoFirstBoard() {
        if (window.location.hash == '#' || !window.location.hash) {
            var boards = this.store.get('tdo.boards');
            if (boards.length > 0)
                window.location.hash = '#' + boards[0].id;
        }
    }

    getDefaultData() {
        var board = {
            id: uid(),
            name: 'Tasks',
            createdDate: new Date().toISOString()
        };

        var list = {
            id: uid(),
            boardId: board.id,
            name: 'List 1',
            createdDate: new Date().toISOString()
        };

        return {
            boards: [board],
            lists: [list],
            tasks: []
        }
    }
}
