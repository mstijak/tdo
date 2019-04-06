import { CollectionTracker } from "./CollectionTracker";
import { firestore } from "./db/firestore";
import { ShallowIndex } from "./ShallowIndex";
import { UserBoard } from "./UserBoard";



export class UserBoardTracker extends CollectionTracker<UserBoard> {
    constructor(userId: string, onUpdate: () => void) {
        let collection = firestore
            .collection("users")
            .doc(userId)
            .collection("boards");
        super(collection, new ShallowIndex<UserBoard>(), onUpdate)
    }

    reorder(suppressUpdate?: boolean) {
        let dirty = false;
        this.index
            .filter(l => !l.deleted)
            .sort((a, b) => a.order - b.order)
            .forEach((item, index) => {
                if (this.update(item.id, { order: index }, { suppressUpdate: true }))
                    dirty = true;
            });
        if (dirty && !suppressUpdate)
            this.onUpdate();
    }

    getActiveBoards() {
        return this.index
            .filter(l => !l.deleted)
            .sort((a, b) => a.order - b.order);
    }
}
