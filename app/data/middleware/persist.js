import {Gists} from '../services/Gists';
import {GHAuth} from '../services/GHAuth';

var saved, saveTaskId;

function save(tdo) {
    if (tdo != saved && tdo.lists && tdo.lists.length > 0) {
        saved = tdo;
        var gh = GHAuth.get();
        if (gh && gh.token && gh.gistId) {
            if (saveTaskId)
                clearTimeout(saveTaskId);
            saveTaskId = setTimeout(()=> {
                saveTaskId = null;
                let gists = new Gists(gh);
                gists.update(tdo);
            }, 5000);
        }
        else {
            localStorage.tdo = JSON.stringify(tdo);
        }
    }
}

export default store => next => action => {
    var result = next(action);
    var {tdo} = store.getState();
    save(tdo);
    return result;
};
