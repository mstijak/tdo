import {Controller, History} from "cx/ui";
import uid from "uid";
import {firestore} from "../../data/db/firestore";

export default ({get, set}) => ({
    onInit() {

    },

    async addBoard(e, {store}) {
        e.preventDefault();
        let board = {...store.get("$record.board")};

        let boardTracker = this.invokeParentMethod("getBoardTracker");

        let id = uid();

        let lists = board.lists || [];
        delete board.lists;

        boardTracker.add({
            id,
            name: 'New Board',
            order: 1e6,
            ...board
        }, {suppressUpdate: true, suppressSync: true});

        boardTracker.reorder();

        let userId = get("user.id");

        History.pushState({}, null, "~/b/" + id);

        let createDate = Date.now();

        let boardDoc = firestore
            .collection("boards")
            .doc(id);

        await boardDoc.set({
            id: id,
            owner: userId,
            createDate
        });

        lists.forEach((list, listIndex) => {
            let listId = uid();
            list = {...list}; //prevent modification
            let tasks = list.tasks || [];
            delete list.tasks;
            boardDoc
                .collection("lists")
                .doc(listId)
                .set({
                    ...list,
                    id: listId,
                    createDate,
                    order: listIndex
                });

            tasks.forEach((task, taskIndex) => {
                let taskId = uid();
                boardDoc
                    .collection("tasks")
                    .doc(taskId)
                    .set({
                        ...task,
                        id: taskId,
                        createDate,
                        listId,
                        order: taskIndex
                    });
            })
        });
    }
});
