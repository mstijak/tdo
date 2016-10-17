export const fetchData = login => dispatch => {
    if (login && login.token && login.gistId) {
        dispatch({
            type: 'REQUEST_TDO'
        });
        let gists = new Gists(gh);
        return gists.load()
            .then(x=> {
                migrate(x);
                dispatch({
                    type: 'RECEIVE-TDO',
                    data: x
                });
            });
    }
    else {
        let data = localStorage.tdo && JSON.parse(localStorage.tdo);
        if (data) {
            dispatch({
                type: 'RECEIVE-TDO',
                data: data
            });
        }
        else {
            dispatch({
                type: 'LOAD-DEFAULT-TDO',
                data: data
            });
        }
    }
};
