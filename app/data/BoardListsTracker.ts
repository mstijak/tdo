import { CollectionTracker } from "./CollectionTracker";
import { firestore } from "./db/firestore";
import { ShallowIndex } from "./ShallowIndex";
import { List } from "./List";

let indexCache: {[key:string]: ShallowIndex<List>} = {};

export class BoardListsTracker extends CollectionTracker<List> {
    constructor(boardId: string, onUpdate: () => void) {
        let collection = firestore.collection("boards").doc(boardId).collection("lists");
        let index = indexCache[boardId];
        if (!index)
            index = indexCache[boardId] = new ShallowIndex<List>();
        super(collection, index, onUpdate)
    }

    reorder(suppressUpdate?: boolean) {
        let dirty = false;
        this.index
            .filter(l => !l.deleted)
            .sort((a, b) => a.order - b.order)
            .forEach((task, index) => {
                if (this.update(task.id, { order: index }, { suppressUpdate: true }))
                    dirty = true;
            });
        if (dirty && !suppressUpdate)
            this.onUpdate();
    }

    getActiveLists() {
        return this.index
            .filter(l => !l.deleted)
            .sort((a, b) => a.order - b.order);
    }
}
