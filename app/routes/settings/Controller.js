import {Controller} from 'cx/ui/Controller';
import {Gists} from '../../services/Gists';

export default class extends Controller {
    init() {
        super.init();

        this.store.set('$page.gh', JSON.parse(localStorage.gh || '{}'));
    }

    load() {
        var gh = this.store.get('$page.gh');
        var gists = new Gists(gh);
        gists.get()
            .then(()=> {
                this.persist();
            });
    }

    create() {
        var gh = this.store.get('$page.gh');
        var gists = new Gists(gh);
        gists
            .create(this.store.get('tdo'))
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
        this.store.delete('tdo');
    }

    changeGist(e) {
        e.preventDefault();
        this.store.set('$page.gh.verified', false);
    }
}
