import {startAppLoop} from 'cx/app/startAppLoop';
import {Store} from 'cx/data/Store';
import Routes from './routes';
import {Widget} from 'cx/ui/Widget';
import './index.scss';

const store = new Store();

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

Widget.resetCounter(); //preserve React keys

stop = startAppLoop(document.getElementById('app'), store, Routes);