/**
 * talaria is a library to provide commenting support for static content,
 * using Github as its persistance layer.
 */

export enum Backend {
    Gists,
    Issues
}

export type MappingUrl = string;
export type CSSSelector = string;

interface IMapping {
    id: string;
}

interface IMappings {
    [permalink: string]: IMapping;
}

interface IMatchedMapping {
    mapping: IMapping;
    obj: Element;
}

interface IUser {
    html_url: string;
    login: string;
    avatar_url: string;
}

interface IComment {
    id: string;
    body: string;
    body_html: string;
    updated_at: string;
    user: IUser;
}

interface ICacheEntry {
    ts: number;
    value: ServerResponse;
}

type CacheEntry = ICacheEntry | null;
type Comments = IComment[];
type ServerResponse = IMappings | Comments;

export interface IConfiguration {
    backend: Backend;
    github_repository?: string;
    github_username?: string;
    mappingUrl: MappingUrl;
    permalinkSelector?: CSSSelector;
    ignoreErrors?: boolean;
    commentsVisible?: boolean;
    cacheTimeout?: number;
}

/**
 * A simple wrapper around `Error` to indicate configuration errors.
 */
export class ConfigError extends Error { }

/**
 * Talaria contains all state necessary to retrieve comments for
 * content on the current page.
 */
export class Talaria {
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
        11: 'Dec'
    };
    // tslint:disable-next-line:no-multiline-string
    private static errorHtml: string = `<div class="talaria">
            <div class="talaria-error">
                Unable to retrieve comments for this post.
            </div>
        </div>`;
    private static defaultConfig = {
        cacheTimeout: 60 * 60 * 1000,
        permalinkSelector: '.permalink'
    };
    private config: IConfiguration;
    private getAPIendpoint: (id: string) => string;
    private objHtmlUrl: (id: string) => string;

    constructor(config: IConfiguration) {
        if (config === undefined || config.backend === undefined || config.mappingUrl === undefined) {
            throw new ConfigError('Invalid configuration, see the docs for required configuration attributes');
        }

        if (config.backend === Backend.Issues &&
            config.github_username === undefined &&
            config.github_repository === undefined) {
            throw new ConfigError('When using Issue-based comments, ' +
                'github_username and github_repository are required config values.');
        }

        if (config.backend === Backend.Gists &&
            config.github_username === undefined) {
            throw new ConfigError('When using Gists-based comments, ' +
                'your github_username is a required config value.');
        }

        config = Object.assign(Talaria.defaultConfig, config);

        this.config = config;
        this.getAPIendpoint = this.commentsUrl();
        this.objHtmlUrl = this.urlForObject();
    }

    public run(): Promise<void> {
        // get all nodes that match our identifier of a post
        const objects: NodeListOf<Element> = document.querySelectorAll(this.config.permalinkSelector);

        if (objects.length > 0) {
            // get mappings
            return this.fetch(this.config.mappingUrl, 'application/json')
                .then((mappings: IMappings) => {
                    // matches are objects we need to retrieve comments for
                    const matches: IMatchedMapping[] = [];

                    // find objects we have mappings for
                    for (let i: number = 0; i < objects.length; i += 1) {
                        const permalink: string = objects[i].getAttribute('href');
                        // if object[href] in mappings, return it
                        if (mappings.hasOwnProperty(permalink)) {
                            matches.push({
                                mapping: mappings[permalink],
                                obj: objects[i]
                            });
                        }
                    }

                    // get comments for all matches
                    Promise.all(matches.map((element: IMatchedMapping): Promise<void> => {
                        return this.fetch(
                            this.getAPIendpoint(element.mapping.id),
                            'application/vnd.github.v3.html+json'
                        ).then((comments: IComment[]) => {
                            // mount comments into DOM
                            const commentHtml: HTMLDivElement = document.createElement('div');
                            // tslint:disable-next-line:no-inner-html
                            commentHtml.innerHTML = this.commentsWrapper(element.mapping.id, comments);

                            // TODO: add configuration option for a selector where the comments are inserted at
                            element.obj.parentElement.appendChild(commentHtml);
                        }).catch((error: XMLHttpRequest) => {
                            if (!this.config.ignoreErrors) {
                                const node: HTMLDivElement = document.createElement('div');
                                // tslint:disable-next-line:no-inner-html
                                node.innerHTML = Talaria.errorHtml;
                                element.obj.parentElement.appendChild(node);
                            }
                        });
                    })).then(() => {
                        const counters: NodeListOf<Element> = document.querySelectorAll('.talaria-counter');
                        for (let i: number = 0; i < counters.length; i += 1) {
                            counters[i].addEventListener('click', (e: Event) => {
                                const t: Element = <Element>e.target;
                                this.showComments(t.getAttribute('data-talaria-id'));
                                e.preventDefault();
                            });
                        }
                    });
                })
                .catch((error: XMLHttpRequest) => {
                    throw new ConfigError('Unable to load mappings file');
                });
        }
        return Promise.reject('No content found');
    }

    private showComments(objId: string): void {
        const id: string = `talaria-comments-${objId}`;
        const comments: HTMLElement = document.getElementById(id);
        comments.classList.remove('talaria-hide');
        // TODO: add CSS animation
    }

    private urlForObject(): (id: string) => string {
        switch (this.config.backend) {
            case Backend.Gists:
                return (id: string): string => `https://gist.github.com/${this.config.github_username}/${id}`;
            case Backend.Issues:
                const root: string =
                    `https://github.com/${this.config.github_username}/${this.config.github_repository}/issues`;

                return (id: string): string => `${root}/${id}`;
            default:
                throw new ConfigError(`ConfigurationError: Unknown TalariaMethod: ${this.config.backend}`);
        }
    }

    private commentsUrl(): (id: string) => string {
        switch (this.config.backend) {
            case Backend.Gists:
                return (id: string): string => `https://api.github.com/gists/${id}/comments`;
            case Backend.Issues:
                const root: string =
                    `https://api.github.com/repos/${this.config.github_username}/${this.config.github_repository}/issues`;

                return (id: string): string => `${root}/${id}/comments`;
            default:
                throw new ConfigError(`ConfigurationError: Unknown TalariaMethod: ${this.config.backend}`);
        }
    }

    private commentMarkup(objUrl: string, comment: IComment): string {
        let commentUrl: string;
        switch (this.config.backend) {
            case Backend.Gists:
                commentUrl = `${objUrl}#gistcomment-${comment.id}`;
                break;
            case Backend.Issues:
                commentUrl = `${objUrl}#issuecomment-${comment.id}`;
                break;
            default:
                throw new ConfigError(`ConfigurationError: Unknown TalariaMethod: ${this.config.backend}`);
        }
        let body: string = comment.body_html;
        if (body === undefined) {
            body = comment.body;
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
                        <div class="talaria-comment-body">${body}</div>
                    </div>
                </div>`;
    }
    private commentsWrapper(objId: string, comments: IComment[]): string {
        const objUrl: string = this.objHtmlUrl(objId);
        const html: string = `<div class="talaria-comment-count">
                <a class="talaria-counter"
                   data-talaria-id="${objId}"
                   href="#">${comments.length} comment${comments.length === 1 ? '' : 's'}</a>
            </div>
            <div class="${this.config.commentsVisible ? '' : 'talaria-hide'}"
                 id="talaria-comments-${objId}">
                ${comments.map((c: IComment) => this.commentMarkup(objUrl, c)).join('')}
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

    private hitCache(key): ServerResponse | null {
        const cache: CacheEntry = JSON.parse(sessionStorage.getItem(key));
        const now: number = (new Date()).getTime();
        if (cache !== null && cache.ts > now - this.config.cacheTimeout) {
            return cache.value;
        }
        return null;
    }

    private cache(key, val) {
        const now: number = (new Date()).getTime();
        const entry: ICacheEntry = {
            ts: now,
            value: val
        };
        sessionStorage.setItem(key, JSON.stringify(entry));
    }

    private async fetch(url: string, accept: string): Promise<{}> {
        return new Promise((resolve: (s: ServerResponse) => void, reject: (req: XMLHttpRequest) => void): void => {
            const cachedResp = this.hitCache(url);
            if (cachedResp !== null) {
                resolve(cachedResp);
            } else {
                const req: XMLHttpRequest = new XMLHttpRequest();
                req.open('GET', url, true);
                req.setRequestHeader('Accept', accept);
                req.onload = (): void => {
                    if (req.status >= 200 && req.status < 400) {
                        const response: string = req.responseText;
                        const resp: ServerResponse = JSON.parse(req.responseText);
                        this.cache(url, resp);
                        resolve(resp);
                    } else {
                        reject(req);
                    }
                };
                req.onerror = (): void => {
                    reject(req);
                };
                req.send();
            }
        });
    }

    private formatDate(date: Date): string {
        const now: Date = new Date();
        const year: number = date.getFullYear();
        const day: number = date.getDate();
        const m: number = date.getMonth();

        if (year === now.getFullYear()) {
            return `on ${Talaria.month[m]} ${day}`;
        }

        return `on ${Talaria.month[m]} ${day}, ${year}`;
    }
}
