export class Gists {

    constructor(gh) {
        this.gh = gh;
    }

    checkOk(response) {
        if (!response.ok)
            throw new Error(`Invalid response received. ${response.statusText}`);
        return response;
    }

    get() {
        let options = {
            headers: {
                'Authorization': `token ${this.getToken()}`
            }
        };

        return fetch(`https://api.github.com/gists/${this.getGistId()}`, options)
            .then(::this.checkOk)
            .then(x=>x.json());
    }

    load() {
        return this.get()
            .then(x=> {
                var tdo = x.files['tdo.json'];
                var data = {};
                if (tdo && tdo.content)
                    data = JSON.parse(tdo.content);
                return data;
            })
    }

    create(data) {
        let options = {
            method: 'POST',
            headers: {
                'Authorization': `token ${this.getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: 'tdo tasks',
                files: this.convertFiles(data)
            })
        };
        return fetch(`https://api.github.com/gists`, options)
            .then(::this.checkOk)
            .then(x=>x.json())
    }

    update(data) {
        let options = {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${this.getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: this.convertFiles(data)
            })
        };
        return fetch(`https://api.github.com/gists/${this.getGistId()}`, options)
            .then(::this.checkOk)
            .then(x=>x.json())
    }

    convertFiles(data) {
        return {
            "tdo.json": {
                content: JSON.stringify(data, null, 2)
            }
        }
    }

    getGistId() {
        if (!this.gh || !this.gh.gistId)
            throw new Error('GistId not set. Please visit the Settings page.');
        return this.gh.gistId;
    }

    getToken() {
        if (!this.gh || !this.gh.token)
            throw new Error('GitHub personal access token not set. Please visit the Settings page.');
        return this.gh.token;
    }
}
