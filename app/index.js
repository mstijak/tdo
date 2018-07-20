import { startHotAppLoop, Widget, FocusManager } from 'cx/ui';
import { Debug } from 'cx/util';
import {createStore, ReduxStoreView} from 'cx-redux';
import { applyMiddleware } from 'redux';
import Routes from './routes';
import './index.scss';
import reducer from './data//reducers';
import middleware from './data/middleware';

const reduxStore = createStore(
    reducer,
    applyMiddleware(...middleware)
);

const store = new ReduxStoreView(reduxStore);

function updateHash() {
    store.set('hash', window.location.hash || '#')
}

updateHash();
setInterval(updateHash, 100);

Debug.enable('app-data');

startHotAppLoop(module, document.getElementById('app'), store, Routes);

// is there a better way to do this
document.body.addEventListener('keyup', e => {

    switch (e.key) {
        case '?':
            if (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
                e.preventDefault();
                e.stopPropagation();
                window.location.hash = '#help';
            }
            break;

        case 'Escape':
            if (!document.activeElement.classList.contains('cxb-task')) {
                e.preventDefault();
                e.stopPropagation();
                var els = document.getElementsByClassName('cxb-task');
                if (els && els.length > 0)
                    FocusManager.focusFirst(els[0]);
            }
            break;

        case '/':
            if (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
                e.preventDefault();
                e.stopPropagation();
                var el = document.getElementById('search');
                    FocusManager.focusFirst(el);
            }
            break;

        case '{':
            {
                if(!e.ctrlKey) break;
                let {hash, tdo} = store.getData();
                hash = hash.split('#').join('');
                var boardInd = tdo.boards.findIndex(a=>a.id == hash);
                if(boardInd == -1) break;
                var prevInd = (boardInd - 1);
                if(prevInd < 0) prevInd = tdo.boards.length - 1;
                var nextBoard = tdo.boards[prevInd];
                window.location = '#' + nextBoard.id;
                break;
            }

        case '}':
            {
                if(!e.ctrlKey) break;
                let {hash, tdo} = store.getData();
                hash = hash.split('#').join('');
                var boardInd = tdo.boards.findIndex(a=>a.id == hash);
                if(boardInd == -1) break;
                var nextBoard = tdo.boards[(boardInd + 1) % tdo.boards.length];
                window.location = '#' + nextBoard.id;
                break;
            }
    }
});
