(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
/**
 * talaria is a library to provide commenting support for static content,
 * using Github as its persistance layer.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
var Backend;
(function (Backend) {
    Backend[Backend["Gists"] = 0] = "Gists";
    Backend[Backend["Issues"] = 1] = "Issues";
})(Backend = exports.Backend || (exports.Backend = {}));
/**
 * A simple wrapper around `Error` to indicate configuration errors.
 */
class ConfigError extends Error {
}
exports.ConfigError = ConfigError;
/**
 * Talaria contains all state necessary to retrieve comments for
 * content on the current page.
 */
class Talaria {
    constructor(config) {
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
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            // get all nodes that match our identifier of a post
            const objects = document.querySelectorAll(this.config.permalinkSelector);
            if (objects.length > 0) {
                // get mappings
                return this.fetch(this.config.mappingUrl, 'application/json')
                    .then((mappings) => {
                    // matches are objects we need to retrieve comments for
                    const matches = [];
                    // find objects we have mappings for
                    for (let i = 0; i < objects.length; i += 1) {
                        const permalink = objects[i].getAttribute('href');
                        // if object[href] in mappings, return it
                        if (mappings.hasOwnProperty(permalink)) {
                            matches.push({
                                mapping: mappings[permalink],
                                obj: objects[i]
                            });
                        }
                    }
                    Promise.all(matches.map(this.handleMatches, this)).then(() => {
                        const counters = document.querySelectorAll('.talaria-counter');
                        for (let i = 0; i < counters.length; i += 1) {
                            counters[i].addEventListener('click', (e) => {
                                const t = e.target;
                                this.showComments(t.getAttribute('data-talaria-id'));
                                e.preventDefault();
                            });
                        }
                    });
                })
                    .catch((error) => {
                    throw new ConfigError('Unable to load mappings file');
                });
            }
            return Promise.reject('No content found');
        });
    }
    insert(el, html) {
        let target = el.parentElement.querySelector(this.config.insertionSelector);
        if (this.config.insertionSelector !== undefined && target === null) {
            console.warn(`Unable to find target node using ${this.config.insertionSelector}`);
        }
        if (target === null) {
            target = el.parentElement;
        }
        target.insertAdjacentHTML('beforeend', html);
    }
    handleMatches(element) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fetch(this.getAPIendpoint(element.mapping.id), 'application/vnd.github.v3.html+json').then((comments) => {
                // mount comments into DOM
                const commentHtml = this.commentsWrapper(element.mapping.id, comments);
                this.insert(element.obj, commentHtml);
            }).catch((error) => {
                if (!this.config.ignoreErrors) {
                    this.insert(element.obj, Talaria.errorHtml);
                }
                else {
                    console.warn(`Unable to retrieve comments for ${element.mapping.id}`);
                }
            });
        });
    }
    showComments(objId) {
        const id = `talaria-comments-${objId}`;
        const comments = document.getElementById(id);
        comments.classList.remove('talaria-hide');
        // TODO: add CSS animation
    }
    urlForObject() {
        switch (this.config.backend) {
            case Backend.Gists:
                return (id) => `https://gist.github.com/${this.config.github_username}/${id}`;
            case Backend.Issues:
                const root = `https://github.com/${this.config.github_username}/${this.config.github_repository}/issues`;
                return (id) => `${root}/${id}`;
            default:
                throw new ConfigError(`ConfigurationError: Unknown TalariaMethod: ${this.config.backend}`);
        }
    }
    commentsUrl() {
        switch (this.config.backend) {
            case Backend.Gists:
                return (id) => `https://api.github.com/gists/${id}/comments`;
            case Backend.Issues:
                const root = `https://api.github.com/repos/${this.config.github_username}/${this.config.github_repository}/issues`;
                return (id) => `${root}/${id}/comments`;
            default:
                throw new ConfigError(`ConfigurationError: Unknown TalariaMethod: ${this.config.backend}`);
        }
    }
    commentMarkup(objUrl, comment) {
        let commentUrl;
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
        let body = comment.body_html;
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
    commentsWrapper(objId, comments) {
        const objUrl = this.objHtmlUrl(objId);
        let html = `<div class="talaria-btn-wrapper">
                <a class="talaria-btn" href="${objUrl}" target="_blank">Be the first to comment</a>
            </div>`;
        if (comments.length > 0) {
            html = `<div class="talaria-comment-count">
                <a class="talaria-counter"
                data-talaria-id="${objId}"
                href="#">${comments.length} comment${comments.length === 1 ? '' : 's'}</a>
            </div>
            <div class="${this.config.commentsVisible ? '' : 'talaria-hide'}"
                id="talaria-comments-${objId}">
                ${comments.map((c) => this.commentMarkup(objUrl, c)).join('')}
                <div class="talaria-btn-wrapper">
                    <a class="talaria-btn" href="${objUrl}" target="_blank">Add a Comment</a>
                </div>
            </div>`;
        }
        return `<div class="talaria">
                    <div class="talaria-comment-list-wrapper">
                        ${html}
                    </div>
                </div>`;
    }
    hitCache(key) {
        const cache = JSON.parse(sessionStorage.getItem(key));
        const now = (new Date()).getTime();
        if (cache !== null && cache.ts > now - this.config.cacheTimeout) {
            return cache.value;
        }
        return null;
    }
    cache(key, val) {
        const now = (new Date()).getTime();
        const entry = {
            ts: now,
            value: val
        };
        sessionStorage.setItem(key, JSON.stringify(entry));
    }
    fetch(url, accept) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const cachedResp = this.hitCache(url);
                if (cachedResp !== null) {
                    resolve(cachedResp);
                }
                else {
                    const req = new XMLHttpRequest();
                    req.open('GET', url, true);
                    req.setRequestHeader('Accept', accept);
                    req.onload = () => {
                        if (req.status >= 200 && req.status < 400) {
                            const response = req.responseText;
                            const resp = JSON.parse(req.responseText);
                            this.cache(url, resp);
                            resolve(resp);
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
        });
    }
    formatDate(date) {
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
Talaria.month = {
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
Talaria.errorHtml = `<div class="talaria">
            <div class="talaria-error">
                Unable to retrieve comments for this post.
            </div>
        </div>`;
Talaria.defaultConfig = {
    cacheTimeout: 60 * 60 * 1000,
    permalinkSelector: '.permalink'
};
exports.Talaria = Talaria;

},{}],2:[function(require,module,exports){
let talaria = require('./dist/talaria');
window.talaria = talaria;
},{"./dist/talaria":1}]},{},[2]);
