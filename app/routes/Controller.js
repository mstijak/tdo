import {Controller} from 'cx/ui/Controller';
import {append} from 'cx/data/ops/append';
import uid from 'uid';
import { loadData, addBoard, gotoBoard } from '../data/actions';

export default class extends Controller {
    init() {
        super.init();

        this.store.dispatch(
            loadData()
        );
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
