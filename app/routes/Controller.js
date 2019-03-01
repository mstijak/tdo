import { Controller, History } from 'cx/ui';
import uid from 'uid';
import { firestore } from "../data/db/firestore";
import { auth } from "../data/db/auth";
import { isNonEmptyArray } from "cx/util";

//TODO: For anonymous users save to local storage

export default class extends Controller {
    onInit() {
        this.store.set('layout.mode', this.getLayoutMode());

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
                let userId = localStorage.getItem('anonymousUserId');
                if (!userId) {
                    userId = uid();
                    localStorage.setItem('anonymousUserId', userId);
                    console.warn('Creating anonymous user', userId);
                }
                this.store.set('user', {
                    id: userId,
                    name: 'Anonymous',
                    anonymous: true
                })
            }
        });

        this.store.init('settings', {
            completedTasksRetentionDays: 1,
            deleteCompletedTasks: true,
            deleteCompletedTasksAfterDays: 7,
            purgeDeletedObjectsAfterDays: 3,
            taskStyles: [{
                regex: '!important',
                style: 'color: orange'
            }, {
                regex: '#idea',
                style: 'color: yellow'
            }]
        });

        this.addTrigger('boardLoader', ['user.id'], userId => {

            if (!userId)
                return;

            //clean up
            this.onDestroy();

            this.unsubscribeBoards = firestore
                .collection('users')
                .doc(userId)
                .collection('boards')
                .onSnapshot(snapshot => {
                    let boards = [];

                    snapshot.forEach(doc => {
                        boards.push(doc.data());
                    });

                    this.store.set('boards', boards);

                    if (!isNonEmptyArray(boards)) {
                        //TODO: Ask the user to create the Welcome board
                    }
                    else if (this.store.get('url') == "~/")
                        History.pushState({}, null, "~/b/" + boards[0].id);
                });

            this.unsubscribeSettings = firestore
                .collection('users')
                .doc(userId)
                .onSnapshot(doc => {
                    let data = doc.exists ? doc.data() : {};
                    this.store.update('settings', settings => ({
                        ...settings,
                        ...data
                    }));
                    this.store.set('settingsLoaded', true);
                });
        }, true);
    }

    onDestroy() {
        this.unsubscribeBoards && this.unsubscribeBoards();
        this.unsubscribeSettings && this.unsubscribeSettings();
    }

    getLayoutMode() {
        if (window.innerWidth >= 1200)
            return 'desktop';

        if (window.innerWidth >= 760)
            return 'tablet';

        return 'phone';
    }

    async addBoard(e) {
        e.preventDefault();

        let id = uid();
        let boards = this.store.get("boards");
        let maxValue = 0;
        boards.filter(e => !e.deleted).map(e => e.order).forEach(e => {
            if (e > maxValue) maxValue = e;
        });

        let p1 = firestore
            .collection('boards')
            .doc('id')
            .set({
                id: id,
                name: 'New Board',
                edit: true,
                order: maxValue + 1
            });

        let userId = this.store.get('user.id');
        let p2 = firestore
            .collection('users')
            .doc(userId)
            .collection('boards')
            .doc(id)
            .set({
                id,
                name: 'New Board',
                edit: true,
                order: maxValue + 1
            });

        await Promise.all([p1, p2]);

        History.pushState({}, null, "~/b/" + id);
    }
}
