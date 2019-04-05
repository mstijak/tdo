import * as firebase from "firebase/app";

import config from "./config";

firebase.initializeApp(config);

export {
    firebase
}


