import "firebase/firestore";

import { firebase } from "./firebase";

const settings = {
    timestampsInSnapshots: true
};

export const firestore = firebase.firestore();

firestore.settings(settings);


