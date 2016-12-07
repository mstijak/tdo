import { Controller } from 'cx/ui';
import { append } from 'cx/data';
import uid from 'uid';
import { loadData, addBoard, gotoBoard } from '../data/actions';

export default class extends Controller {
    init() {
        super.init();

        this.store.set('layout.mode', this.getLayoutMode())

        this.store.dispatch(
            loadData()
        );
    }

    getLayoutMode() {
        if (window.innerWidth >= 1200)
            return 'desktop';

        if (window.innerWidth >= 760)
            return 'tablet';

        return 'phone';
    }

    addBoard(e) {
        e.preventDefault();

        var id = uid();

        this.store.dispatch(
            addBoard({
                id: id,
                name: 'New Board',
                edit: true
            })
        );

        this.store.dispatch(
            gotoBoard(id)
        );
    }
}
