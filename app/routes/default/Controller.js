import {Controller} from 'cx/ui/Controller';

export default class extends Controller {
    init() {
        super.init();

        this.store.init('lists', [{
            id: 1,
            name: 'Bugs'
        }, {
            id: 2,
            name: 'Features'
        }, {
            id: 3,
            name: 'Ideas'
        }]);


        this.store.init('tasks', [{
            id: 1,
            name: "Fiddle: Saved doesn't appear anymore"
        }, {
            id: 2,
            name: 'grid empty text'
        }, {
            id: 3,
            name: 'visible: false in grid column'
        }]);
    }

    onItemClick(e, {store}) {
        store.set('$task.edit', true);
    }
}
