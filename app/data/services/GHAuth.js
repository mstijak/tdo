export class GHAuth {
    static get() {
        return localStorage.gh && JSON.parse(localStorage.gh);
    }

    static set(gh) {
        if (gh)
            localStorage.gh = JSON.stringify(gh);
        else
            delete localStorage.gh;
    }
}
