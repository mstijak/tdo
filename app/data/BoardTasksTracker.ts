import { CollectionTracker } from "./CollectionTracker";
import { firestore } from "./db/firestore";
import { ShallowIndex } from "./ShallowIndex";
import { Task } from "./Task";

let indexCache: {[key:string]: ShallowIndex<Task>} = {};

export class BoardTasksTracker extends CollectionTracker<Task> {
    constructor(boardId: string, onUpdate: () => void) {
        let collection = firestore.collection("boards").doc(boardId).collection("tasks");
        let index = indexCache[boardId];
        if (!index)
            index = indexCache[boardId] = new ShallowIndex<Task>();
        super(collection, index, onUpdate)
    }

    reorderList(listId, suppressUpdate?: boolean) {
        let dirty = false;
        this.index
            .filter(t => t.listId == listId && !t.deleted)
            .sort((a, b) => a.order - b.order)
            .forEach((task, index) => {
                if (this.update(task.id, { order: index }, { suppressUpdate: true }))
                    dirty = true;
            });
        if (dirty && !suppressUpdate)
            this.onUpdate();
    }

    getListTasksSorted(listId) {
        return this.index
            .filter(t => t.listId == listId && !t.deleted)
            .sort((a, b) => a.order - b.order);
    }

    moveTaskToList(taskId, listId) {
        let task = this.index.get(taskId);
        if (task.listId == listId)
            return false;

        this.update(taskId, {
            listId,
            order: this.getListTasksSorted(listId).length
        });

        this.reorderList(task.listId);
    };
}
