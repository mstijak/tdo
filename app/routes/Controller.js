import { History } from "cx/ui";
import uid from "uid";
import { firestore } from "../data/db/firestore";
import { auth } from "../data/db/auth";
import { isNonEmptyArray } from "cx/util";
import { UserBoardTracker } from "../data/UserBoardsTracker";
import { registerKeyboardShortcuts } from "./keyboard-shortcuts";
import { Toast, Button, Text } from "cx/widgets";

//TODO: For anonymous users save to local storage

export default ({ store, get, set, init }) => {

    init("settings", {
        deleteCompletedTasks: true,
        deleteCompletedTasksAfterDays: 7,
        purgeDeletedObjectsAfterDays: 3,
        taskStyles: [{
            regex: "!important",
            style: "color: orange"
        }, {
            regex: "#idea",
            style: "color: yellow"
        }]
    });

    let boardTracker = null;

    return {
        onInit() {
            this.store.set("layout.mode", this.getLayoutMode());

            auth.onAuthStateChanged(user => {
                if (user) {
                    this.store.set(
                        "user",
                        {
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            id: user.uid
                        }
                    );
                }
                else {
                    let userId = localStorage.getItem("anonymousUserId");
                    if (!userId) {
                        userId = uid();
                        localStorage.setItem("anonymousUserId", userId);
                        console.warn("Creating anonymous user", userId);
                    }
                    this.store.set("user", {
                        id: userId,
                        name: "Anonymous",
                        anonymous: true
                    });
                }
            });

            this.addTrigger("boardLoader", ["user.id"], userId => {

                if (!userId)
                    return;

                //clean up
                boardTracker && boardTracker.stop();
                this.unsubscribeSettings && this.unsubscribeSettings();

                boardTracker = new UserBoardTracker(userId, () => {
                    let boards = boardTracker.index.filter(b => !b.deleted);
                    this.store.set("boards", boards);

                    set("boards", boards);

                    if (!isNonEmptyArray(boards)) {
                        //TODO: Ask the user to create the Welcome board
                    }
                    else if (get("url") == "~/")
                        History.pushState({}, null, "~/b/" + boards[0].id);
                });

                boardTracker.start();

                this.unsubscribeSettings = firestore
                    .collection("users")
                    .doc(userId)
                    .onSnapshot(doc => {
                        let data = doc.exists ? doc.data() : {};
                        this.store.update("settings", settings => ({
                            ...settings,
                            ...data
                        }));
                        this.store.set("settingsLoaded", true);
                    });
            }, true);

            this.unregisterKeyboardShortcuts = registerKeyboardShortcuts(store);
        },

        onDestroy() {
            boardTracker && boardTracker.stop();
            this.unsubscribeSettings && this.unsubscribeSettings();
            this.unregisterKeyboardShortcuts();
        },

        getLayoutMode() {
            if (window.innerWidth >= 1200)
                return "desktop";

            if (window.innerWidth >= 760)
                return "tablet";

            return "phone";
        },

        async onAddBoard(e) {
            e.preventDefault();

            let id = uid();

            boardTracker.add({
                id,
                name: 'New Board',
                edit: true,
                order: 1e6
            }, { suppressUpdate: true, suppressSync: true });

            boardTracker.reorder();

            let userId = get("user.id");

            History.pushState({}, null, "~/b/" + id);

            await firestore
                .collection("boards")
                .doc(id)
                .set({
                    id: id,
                    owner: userId
                });
        },

        onMoveBoardLeft(e, { store }) {
            let { $board } = store.getData();
            let boards = boardTracker.getActiveBoards();
            let index = boards.findIndex(b => b.id == $board.id);

            if (index > 0) {
                boardTracker.update($board.id, {
                    order: boards[index - 1].order - 0.1
                }, { suppressUpdate: true, suppressSync: true });
                boardTracker.reorder();
            }
        },

        onMoveBoardRight(e, { store }) {
            let { $board } = store.getData();
            let boards = boardTracker.getActiveBoards();
            let index = boards.findIndex(b => b.id == $board.id);

            if (index + 1 < boards.length) {
                boardTracker.update($board.id, {
                    order: boards[index + 1].order + 0.1
                }, { suppressUpdate: true, suppressSync: true });
                boardTracker.reorder();
            }
        },

        onDeleteBoard(e, { store }) {
            let board = store.get("$board");
            boardTracker.update(board.id, {
                deleted: true,
                deletedDate: new Date().toISOString(),
                edit: false
            }, { suppressUpdate: true });
            boardTracker.reorder(true);
            boardTracker.forceUpdate();
            let boards = boardTracker.getActiveBoards();
            History.pushState({}, null, boards.length > 0 ? "~/b/" + boards[0].id : "~/")

            Toast.create({
                mod: 'warning',
                timeout: 3000,
                items: (
                    <cx>
                        <div ws>
                            <Text value={`Board ${board.name} has been deleted`} />
                            <Button dismiss text="Undo" onClick={() => this.onUndoDeleteBoard(board.id)} />
                        </div>
                    </cx>
                )
            }).open();
        },

        onUndoDeleteBoard(id) {
            boardTracker.update(id, {
                deleted: false,
                deletedDate: null
            }, { suppressUpdate: true });
            boardTracker.reorder(true);
            boardTracker.forceUpdate();
        },

        onSaveBoard(e, { store }) {
            let board = store.get("$board");
            boardTracker.update(board.id, {
                ...board,
                edit: false,
                lastChangeDate: new Date().toISOString()
            })
        },

        onEditBoard(e, { store }) {
            e.preventDefault();
            e.stopPropagation();
            let board = store.get("$board");
            boardTracker.update(board.id, {
                edit: true
            })
        }
    }
}
