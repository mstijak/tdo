import { Controller } from 'cx/ui/Controller';
import { MsgBox } from 'cx/ui/overlay/MsgBox';
import { Gists } from '../../data/services/Gists';
import { loadData, loadDefault } from '../../data/actions';
import { append } from 'cx/data/ops/';

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
                this.store.dispatch(
                    loadData(gh)
                );
            })
            .catch(e=> {
                MsgBox.alert('Error occurred: ' + e);
                console.log(e);
            })
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
        this.store.dispatch(
            loadDefault()
        )
    }

    changeGist(e) {
        e.preventDefault();
        this.store.set('$page.gh.verified', false);
    }

    addTaskStyle(e) {
        e.preventDefault();
        this.store.update('tdo.settings.taskStyles', append, {});
    }

    removeTaskStyle(e, {store}) {
        e.preventDefault();
        var style = store.get('$record');
        this.store.update('tdo.settings.taskStyles', styles => styles.filter(x=>x != style));
    }
}
