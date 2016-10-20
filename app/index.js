import {startAppLoop} from 'cx/app/startAppLoop';
import {createStore, ReduxStoreView} from 'cx-redux';
import { applyMiddleware } from 'redux';
import Routes from './routes';
import {Widget} from 'cx/ui/Widget';
import {Debug} from 'cx/util/Debug';
import './index.scss';
import reducer from './data//reducers';
import middleware from './data/middleware';

const reduxStore = createStore(
    reducer,
    applyMiddleware(...middleware)
);

const store = new ReduxStoreView(reduxStore);

var stop;
if (module.hot) {
    // accept itself
    module.hot.accept();

    // remember data on dispose
    module.hot.dispose(function (data) {
        data.state = store.getData();
        if (stop)
            stop();
    });

    // apply data on hot replace
    if (module.hot.data)
        store.load(module.hot.data.state);
}

function updateHash() {
    store.set('hash', window.location.hash || '#')
}

updateHash();
setInterval(updateHash, 100);

Widget.resetCounter(); //preserve React keys
Debug.enable('app-data');

stop = startAppLoop(document.getElementById('app'), store, Routes);

//is there a better way to do this
document.body.addEventListener('keypress', e => {
    switch (e.key) {
        case '?':
            if (e.target.tagName != 'INPUT') {
                e.preventDefault();
                e.stopPropagation();
                window.location.hash = '#help';
            }
            break;
    }
});