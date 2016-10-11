import {Controller} from 'cx/ui/Controller';
import {Gists} from '../../services/Gists';

export default class extends Controller {
    init() {
        super.init();

        this.store.set('$page.gh', JSON.parse(localStorage.gh || '{}'));

        //todo: move this in sync
        this.addTrigger('save', ['$page.gh'], (gh) => {

        });
    }

    load() {
        var gh = this.store.get('$page.gh');
        var gists = new Gists(gh);
        gists.get()
            .then(x=> {
                this.persist();
            });
    }

    create() {
        var gh = this.store.get('$page.gh');
        var gists = new Gists(gh);
        gists
            .create({
                lists: this.store.get('lists'),
                tasks: this.store.get('tasks'),
            })
            .then(x=> {
                this.store.set('$page.gh.gistId', x.id);
                this.persist();
            });
    }

    persist() {
        this.store.set('$page.gh.verified', true);
        let gh = this.store.get('$page.gh');
        localStorage.gh = JSON.stringify(gh);
    }

    unlink(e) {
        e.preventDefault();
        this.store.set('$page.gh', null);
        localStorage.gh = null;
    }

    changeGist(e) {
        e.preventDefault();
        this.store.set('$page.gh.verified', false);
    }


}
