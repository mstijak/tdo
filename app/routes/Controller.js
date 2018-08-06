import { Controller, History } from 'cx/ui';
import uid from 'uid';
import { firestore } from "../data/db/firestore";
import {isNonEmptyArray} from "cx/util";

//TODO: For anonymous users save to local storage

export default class extends Controller {
    onInit() {
        this.store.set('layout.mode', this.getLayoutMode());

        this.addTrigger('boardLoader', ['user.id'], userId => {
           if (this.unsubscribeBoards)
               this.unsubscribeBoards();

           this.unsubscribeBoards = firestore
               .collection('users')
               .doc(userId)
               .collection('boards')
               .onSnapshot(snapshot => {
                   let boards = [];

                   snapshot.forEach(doc => {
                       boards.push(doc.data());
                   });

                   if (!isNonEmptyArray(boards)) {
                        //TODO: Ask the user to create the Welcome board
                   }

                   this.store.set('boards', boards);
               });
        }, true);
    }

    onDestroy() {
        if (this.unsubscribeBoards)
            this.unsubscribeBoards();
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

        let p1 = firestore
            .collection('boards')
            .doc('id')
            .set({
                id: id,
                name: 'New Board',
                edit: true
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
                    edit: true
                });

        await Promise.all([p1, p2]);

        History.pushState({}, null, "~/b/" + id);
    }
}
