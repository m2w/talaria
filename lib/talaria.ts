enum TalariaMethod {
    Gists,
    Issues,
}

type MappingUrl = string;
interface Mapping {
    id: string;
}
interface Mappings {
    [permalink: string]: Mapping;
}
type CSSSelector = string;

interface MatchedMapping {
    mapping: Mapping;
    obj: Element;
}

interface Configuration {
    method: TalariaMethod;
    github_repository?: string;
    github_username?: string;
    mappingUrl: MappingUrl;
    permalinkSelector?: CSSSelector;
    ignoreErrors?: boolean;
    commentsVisible?: boolean;
}

class ConfigError extends Error { }

class Talaria {
    private static month: { [m: number]: string } = {
        0: 'Jan',
        1: 'Feb',
        2: 'Mar',
        3: 'Apr',
        4: 'May',
        5: 'Jun',
        6: 'Jul',
        7: 'Aug',
        8: 'Sep',
        9: 'Oct',
        10: 'Nov',
        11: 'Dec',
    };
    private static errorHtml = `<div class="talaria">
            <div class="talaria-error">
                Unable to retrieve comments for this post.
            </div>
        </div>`;
    private config: Configuration;
    private getAPIendpoint: (id: string) => string;
    private objHtmlUrl: (id: string) => string;

    constructor(config: Configuration) {
        if (!config.permalinkSelector) {
            config.permalinkSelector = '.permalink';
        }
        if (config.method === TalariaMethod.Issues && !(config.github_username && config.github_repository)) {
            throw new ConfigError('Configuration Error: When using Issue-based comments, ' +
                'github_username and github_repository are required config values.');
        }

        if (config.method === TalariaMethod.Gists && !config.github_username) {
            throw new ConfigError('Configuration Error: When using Gists-based comments, ' +
                'your github_username is a required config value.');
        }

        this.config = config;
        this.getAPIendpoint = this.commentsUrl();
        this.objHtmlUrl = this.urlForObject();
    }

    public run() {
        // get all nodes that match our identifier of a post
        const objects = document.querySelectorAll(this.config.permalinkSelector);

        if (objects.length > 0) {
            // 1. get mappings
            this.get(this.config.mappingUrl, 'application/json')
                .then((mappings: Mappings) => {
                    // matches are objects we need to retrieve comments for
                    const matches: MatchedMapping[] = [];

                    // find objects we have mappings for
                    for (let i = 0; i < objects.length; i++) {
                        const permalink = objects[i].getAttribute('href');
                        // if object[href] in mappings, return it
                        if (mappings.hasOwnProperty(permalink)) {
                            matches.push({
                                mapping: mappings[permalink],
                                obj: objects[i],
                            });
                        }
                    }

                    // get comments for all matches
                    Promise.all(matches.map((element) => {
                        return this.get(this.getAPIendpoint(element.mapping.id),
                            'application/vnd.github.v3.html+json')
                            .then((comments: [{}]) => {
                                // mount comments into DOM
                                const commentHtml = document.createElement('div');
                                commentHtml.innerHTML = this.commentsWrapper(element.mapping.id, comments);

                                // TODO: add configuration option for a selector where the comments are inserted at
                                element.obj.parentElement.appendChild(commentHtml);
                            }).catch((error) => {
                                if (!this.config.ignoreErrors) {
                                    const node = document.createElement('div');
                                    node.innerHTML = Talaria.errorHtml;
                                    element.obj.parentElement.appendChild(node);
                                }
                            });
                    })).then(() => {
                        const counters = document.querySelectorAll('.talaria-counter');
                        for (let i = 0; i < counters.length; i++) {
                            counters[i].addEventListener('click', (e) => {
                                const t = e.target as Element;
                                this.showComments(t.getAttribute('data-talaria-id'));
                                e.preventDefault();
                            });
                        }
                    });
                })
                .catch((error) => {
                    throw new Error('Configuration Error: Unable to load mappings file');
                });
        }
    }

    private showComments(objId: string) {
        const id = `talaria-comments-${objId}`;
        const comments = document.getElementById(id);
        comments.classList.remove('talaria-hide');
        // TODO: add CSS animation
    }

    private urlForObject(): (id: string) => string {
        switch (this.config.method) {
            case TalariaMethod.Gists:
                return (id: string) => `https://gist.github.com/${this.config.github_username}/${id}`;
            case TalariaMethod.Issues:
                const root =
                    `https://github.com/${this.config.github_username}/${this.config.github_repository}/issues`;
                return (id: string) => `${root}/${id}`;
        }
    }

    private commentsUrl(): (id: string) => string {
        switch (this.config.method) {
            case TalariaMethod.Gists:
                return (id: string) => `https://api.github.com/gists/${id}/comments`;
            case TalariaMethod.Issues:
                const root =
                    `https://api.github.com/repos/${this.config.github_username}/${this.config.github_repository}/issues`;
                return (id: string) => `${root}/${id}/comments`;
        }
    }

    private commentMarkup(objUrl: string, comment): string {
        let commentUrl: string;
        switch (this.config.method) {
            case TalariaMethod.Gists:
                commentUrl = `${objUrl}#gistcomment-${comment.id}`;
                break;
            case TalariaMethod.Issues:
                commentUrl = `${objUrl}#issuecomment-${comment.id}`;
                break;
        }
        return `<div id="${comment.id}" class="talaria-comment-wrapper">
                    <a class="talaria-avatar-wrapper talaria-link" href="${comment.user.html_url}">
                        <img class="talaria-avatar" height="44" width="44" src="${comment.user.avatar_url}" />
                    </a>
                    <div class="talaria-comment">
                        <div class="talaria-comment-header">
                            <strong>
                                <a class="talaria-link"
                                   href="${comment.user.html_url}"
                                   target="_blank">${comment.user.login}</a>
                            </strong>
                            commented
                            <a class="talaria-link"
                               href="${commentUrl}"
                               target="_blank">${this.formatDate(new Date(comment.updated_at))}</a>
                        </div>
                        <div class="talaria-comment-body">${(comment.body_html || comment.body)}</div>
                    </div>
                </div>`;
    }
    private commentsWrapper(objId: string, comments: [{}]): string {
        const objUrl = this.objHtmlUrl(objId);
        const html = `<div class="talaria-comment-count">
                <a class="talaria-counter"
                   data-talaria-id="${objId}"
                   href="#">${comments.length} comment${comments.length === 1 ? '' : 's'}</a>
            </div>
            <div class="${this.config.commentsVisible ? '' : 'talaria-hide'}"
                 id="talaria-comments-${objId}">
                ${comments.map((c) => this.commentMarkup(objUrl, c)).join('')}
            </div>`;
        // FIXME: add special style for empty comments array
        return `<div class="talaria">
                    <div class="talaria-comment-list-wrapper">
                        ${html}
                        <div class="talaria-btn-wrapper">
                            <a class="talaria-btn" href="${objUrl}" target="_blank">Add a Comment</a>
                        </div>
                    </div>
                </div>`;
    }

    private get(url: string, accept: string): Promise<{}> {
        return new Promise((resolve, reject) => {
            const cache = sessionStorage.getItem(url);
            if (cache) {
                resolve(JSON.parse(cache));
            }
            else {
                const req = new XMLHttpRequest();
                req.open('GET', url, true);
                req.setRequestHeader('Accept', accept);
                req.onload = () => {
                    if (req.status >= 200 && req.status < 400) {
                        const response = req.responseText;
                        sessionStorage.setItem(url, response);
                        resolve(JSON.parse(response));
                    }
                    else {
                        reject(req);
                    }
                };
                req.onerror = () => {
                    reject(req);
                };
                req.send();
            }
        });
    }

    private formatDate(date: Date): string {
        const now = new Date();
        const year = date.getFullYear();
        const day = date.getDate();
        const m = date.getMonth();

        if (year === now.getFullYear()) {
            return `on ${Talaria.month[m]} ${day}`;
        }
        return `on ${Talaria.month[m]} ${day}, ${year}`;
    }
}
