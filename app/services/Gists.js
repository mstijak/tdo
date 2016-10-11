export class Gists {

    constructor(gh) {
        this.gh = gh;
    }

    get() {
        return fetch(`https://api.github.com/gists/${this.gh.gistId}`, {
            headers: {
                'Authorization': `token ${this.gh.token}`
            }
        });
    }

    getPAT() {
        if (!this.gh || !this.gh.token)
            throw new Error('GitHub personal access token not set. Please visit the Settings page.');
        return this.gh.token;
    }
}
