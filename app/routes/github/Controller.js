import {Controller} from 'cx/ui/Controller';
import {Gists} from '../../services/Gists';

export default class extends Controller {
    init() {
        super.init();

        this.store.set('$page.gh', JSON.parse(localStorage.gh || '{}'));

        //todo: move this in sync
        this.addTrigger('save', ['$page.gh'], (gh) => {
            localStorage.gh = JSON.stringify(gh);
        });
    }

    sync() {
        var gh = this.store.get('$page.gh');
        var gists = new Gists(gh);
        gists.get()
            .then(x=>x.json())
            .then(x=>console.log(x));
    }
}
