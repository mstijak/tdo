import { Controller } from 'cx/ui';
import { append } from 'cx/data';
import {firestore} from "../../data/db/firestore";
import {auth} from "../../data/db/auth";
import {firebase} from "../../data/db/firebase";
import {showErrorToast, toast} from "../../components/toasts";

export default class extends Controller {
    onInit() {
        this.addTrigger('saveSettings', ['settings'], settings => {
            if (!this.store.get('settingsLoaded'))
                return;
            let userId = this.store.get('user.id')
            firestore
                .collection('users')
                .doc(userId)
                .set(settings)
                .catch(showErrorToast);
        })
    }

    addTaskStyle(e) {
        e.preventDefault();
        this.store.update('settings.taskStyles', append, {});
    }

    removeTaskStyle(e, {store}) {
        e.preventDefault();
        let style = store.get('$record');
        this.store.update('settings.taskStyles', styles => styles.filter(x => x != style));
    }

    signInWithGoogle(e) {
        e.preventDefault();
        let provider = new firebase.auth.GoogleAuthProvider();
        this.signInWithProvider(provider);
    }

    signInWithTwitter(e) {
        e.preventDefault();
        let provider = new firebase.auth.TwitterAuthProvider();
        this.signInWithProvider(provider);
    }

    signInWithGitHub(e) {
        e.preventDefault();
        let provider = new firebase.auth.GithubAuthProvider();
        this.signInWithProvider(provider);
    }

    signInWithProvider(provider) {
        auth
            .signInWithPopup(provider)
            .catch(error => {
                toast({
                    message: `Login failed with error code ${error.code}. ${error.message}`,
                    timeout: 15000,
                    mod: "error"
                });
            });
    }

    signOut(e) {
        e.preventDefault();
        auth.signOut().then(() => {
            window.location.reload();
        });
    }
}
