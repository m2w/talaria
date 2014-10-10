/*global document,$,async,sessionStorage,location*/
var talaria = (function ($, async) {
    'use strict';

    /*
     * Default config
     */
    var CONFIG = {},
        DEFAULTS = {
            COMMENTABLE_CONTENT_PATH_PREFIX: '_posts/',
            CONTENT_SUFFIX: '.md',
            CACHE_TIMEOUT: 60 * 60 * 1000, // cache github data for 1 hour
            PAGINATION_SCHEME: /\/page\d+\//,
            LOCAL_STORAGE_SUPPORTED: false,
            PERMALINK_IDENTIFIER: 'a.permalink',
            PERMALINK_STYLE: /[\.\w\-_:\/]+\/(\d+)\/(\d+)\/(\d+)\/([\w\-\.]+)$/
        };

    /*
     * Utilities
     */
    function setPermalinkRegex() {
        switch (CONFIG.PERMALINK_STYLE) {
        case 'pretty':
            return /[\.\w\-_:\/]+\/(\d+)\/(\d+)\/(\d+)\/([\w\-\.]+)\/$/;
        case 'date':
            return /[\.\w\-_:\/]+\/(\d+)\/(\d+)\/(\d+)\/([\w\-\.]+)\.html$/;
        case 'none':
            if (CONFIG.USE_COMMITS) {
                throw new Error('When using commit-based comments,' +
                                ' talaria requires the use of' +
                                ' permalinks that include the date' +
                                ' of the post');
            }
            return /[\.\w\-_:\/]+\/([\w\-\.]+)\.html$/;
        default: return CONFIG.PERMALINK_STYLE;
        }
    }

    function extrapolatePathFromPermalink(permalinkUrl) {
        return permalinkUrl.replace(CONFIG.PERMALINK_STYLE,
            CONFIG.COMMENTABLE_CONTENT_PATH_PREFIX + '$1-$2-$3-$4' + CONFIG.CONTENT_SUFFIX);
    }

    function shortenCommitId(commitId) {
        return commitId.substr(0, 7);
    }

    function localStorageSupported() {
        try {
            sessionStorage.setItem('dummy', 'dummy');
            sessionStorage.removeItem('dummy');
            return true;
        } catch (e) {
            return false;
        }
    }

    function cacheCommentData(key, data) {
        if (CONFIG.LOCAL_STORAGE_SUPPORTED) {
            sessionStorage.setItem(key, JSON.stringify({
                timestamp: new Date().getTime(),
                commentData: data
            }));
        }
    }

    function byAscendingDate(commentA, commentB) {
        return new Date(commentA.updated_at) > new Date(commentB.updated_at);
    }

    /*
     * timeDifference is taken from:
     * http://stackoverflow.com/questions/6108819/javascript-timestamp-to-relative-time-eg-2-seconds-ago-one-week-ago-etc-best
     * tweaks by me
     */
    function timeDifference(current, previous) {
        function maybePluralize(elapsed) {
            return elapsed === 1 ? '' : 's';
        }
        var msPerMinute = 60 * 1000,
            msPerHour = msPerMinute * 60,
            msPerDay = msPerHour * 24,
            msPerMonth = msPerDay * 30,
            msPerYear = msPerDay * 365,
            justNowLim = 15 * 1000,
            elapsed = current - previous,
            t = 0;
        if (elapsed < msPerMinute) {
            return elapsed < justNowLim ? ' just now' : Math.round(elapsed / 1000) + ' seconds ago';
        }
        if (elapsed < msPerHour) {
            t = Math.round(elapsed / msPerMinute);
            return t + ' minute' + maybePluralize(t) + ' ago';
        }
        if (elapsed < msPerDay) {
            t = Math.round(elapsed / msPerHour);
            return t + ' hour' + maybePluralize(t) + ' ago';
        }
        if (elapsed < msPerMonth) {
            t = Math.round(elapsed / msPerDay);
            return t + ' day' + maybePluralize(t) + ' ago';
        }
        if (elapsed < msPerYear) {
            t = Math.round(elapsed / msPerMonth);
            return 'about ' + t + ' month' + maybePluralize(t) + ' ago';
        }
        t = Math.round(elapsed / msPerYear);
        return 'about ' + t + ' year' + maybePluralize(t) + ' ago';
    }

    function isStale(cachedCommentData) {
        return (new Date().getTime() - cachedCommentData.timestamp) > CONFIG.CACHE_TIMEOUT;
    }

    function maybeGetCachedVersion(url) {
        var cache = sessionStorage.getItem(url);
        if (cache) {
            cache = JSON.parse(cache);
            if (!isStale(cache)) {
                return cache.commentData;
            }
        }
        return undefined;
    }

    function ensureAsyncAvailable () {
        if (CONFIG.USE_GISTS && async === {}){
            throw new Error('talaria requires async.js for gist-based comments.');
        }
    }

    /*
     * Templates
     */
    function wrapperTemplate(id, url, ccount, commentsHidden) {
            return '<div id="talaria-wrap-' + id + '" class="talaria-wrapper">' +
            '  <div class="talaria-load-error hide">' +
            '    Unable to retrieve comments for this post.' +
            '  </div>' +
            '  <div class="talaria-comment-count' + (commentsHidden ? '' : ' hide') + '">' +
            '    <a id="talaria-show-' + id + '" href="' + url + '">' + (ccount === 0 ? 'Be the first to comment' : (ccount + ' comment' + (ccount === 1 ? '' : 's'))) + '</a>' +
            '  </div>' +
            '  <div class="talaria-comment-list-wrapper' + (commentsHidden ? ' hide' : '') + '">' +
            '    <div class="talaria-header">' +
            '      <h3>Comments <small>via <a class="talaria-last-commit-href" href="' + url + '">github</a></small></h3>' +
            '    </div>' +
            '    <div class="talaria-comment-list">' +
            '      <!-- comments are dynamically added here -->' +
            '    </div>' +
            '    <div class="talaria-align-right">' +
            '      <a id="talaria-add-' + id + '" class="talaria-add-comment-button" href="' + url + '">' +
            '        <button type="submit">Add a Comment</button>' +
            '      </a>' +
            '    </div>' +
            '  </div>' +
            '</div>';
    }

    function commentTemplate(comment) {
        var now = new Date().getTime(),
            headerLeft;
        if (comment.commit_id !== undefined) {
            headerLeft = '<span class="talaria-header-left">&nbsp;commented on <a class="talaria-commit-sha" href="' + comment.html_url + '">' +
                '<code>' + shortenCommitId(comment.commit_id) + '</code></a></span>';
        } else {
            headerLeft = '<span class="talaria-header-left">&nbsp;</span>';
        }

        return '<div id="' + comment.id + '" class="talaria-comment-bubble">' +
            '  <a href="#">' +
            '    <img class="talaria-comment-author-avatar" height="48" width="48" src="' + comment.user.avatar_url + '" />' +
            '  </a>' +
            '  <div class="talaria-comment-bubble-content">' +
            '    <div class="talaria-comment-bubble-inner">' +
            '      <div class="talaria-comment-header">' +
            '        <a class="talaria-author-nick" href="' + comment.user.html_url + '"><b>' + comment.user.login + '</b></a>' +
            headerLeft +
            '        <span class="talaria-header-right">' + timeDifference(now, new Date(comment.updated_at)) + '</span>' +
            '      </div>' +
            '      <div class="talaria-comment-body">' + comment.body_html || comment.body + '</div>' +
            '    </div>' +
            '  </div>' +
            '</div>';
    }

    /*
     * github API interaction - Commit-based
     */
    function retrieveCommentsForCommit(commit, path) {
        var dfd = new $.Deferred();
        $.getJSON(CONFIG.COMMIT_API_ENDPOINT + '/' + commit.sha + '/comments').then(function (comments) {
            dfd.resolve({
                commits: commit,
                comments: comments,
                path: path
            });
        }, function (error) {
            dfd.reject(error.status);
        });
        return dfd;
    }

    function combineDataForFile(path, commits) {
        var dfd = new $.Deferred(),
            deferredComments = commits.map(function (commit) {
                return retrieveCommentsForCommit(commit, path);
            });
        $.when.apply($, deferredComments).done(function () {
            var data = Array.prototype.slice.call(arguments, 0),
                root;
            if (data && data.length) {
                root = {
                    path: path,
                    commits: [],
                    comments: []
                };
                data = data.reduce(function (acc, elem) {
                    acc.commits = acc.commits.concat(elem.commits);
                    acc.comments = acc.comments.concat(elem.comments);
                    return acc;
                }, root);
            }
            dfd.resolve(data);
        });
        return dfd;
    }

    function getDataForPathWithDeferred(path) {
        var dfd = new $.Deferred();
        $.getJSON(CONFIG.COMMIT_API_ENDPOINT, {
            path: path
        }).then(function (commits) {
            combineDataForFile(path, commits).done(function (dataForPath) {
                dfd.resolve(dataForPath);
            });
        }, function (error) {
            dfd.reject(error.status);
        });
        return dfd;
    }

    function retrieveDataForPermalink(url) {
        var path = extrapolatePathFromPermalink(url),
            cache;
        if (CONFIG.LOCAL_STORAGE_SUPPORTED) {
            cache = maybeGetCachedVersion(url);
            if (cache) {
                var dfd = new $.Deferred();
                dfd.resolve(cache);
                return dfd;
            }
            return getDataForPathWithDeferred(path);
        }
        return getDataForPathWithDeferred(path);
    }


    /*
     * github API interaction - Gist-based
     */
    function retrieveGistBasedComments() {
        $.getJSON(CONFIG.GIST_MAPPINGS, function (gistMappings) {
            retrieveCommentsForGistMappings(gistMappings);
        }).fail(function (error) { // misconfiguration, either incorrect json or file not available
            // TODO: error handling
        });
    }

    function retrieveGistComments(gist, callback) {
        var matchingPermalink;
        $.getJSON('https://api.github.com/gists/' + gist.id + '/comments').
            then(function (comments) {
                gist.comments = comments;
                matchingPermalink = $(CONFIG.PERMALINK_IDENTIFIER + '[href="' + gist.permalink + '"]');
                // cache the data
                if (CONFIG.LOCAL_STORAGE_SUPPORTED) {
                    sessionStorage.setItem(gist.permalink, JSON.stringify({
                        timestamp: new Date().getTime(),
                        commentData: gist
                    }));
                }
                // add the comments
                if (matchingPermalink !== []) {
                    addGistComments(matchingPermalink, gist);
                }
                callback(null, gist);
            }, function (error) {
                gist.comments = [];
                callback(error, gist);
            });
    }

    function retrieveCommentsForGistMappings(gistMappings) {
        async.mapLimit(gistMappings, 5, retrieveGistComments, function (err, results) {
            if (err) { // rate-limit reached, invalid id, other?
                // TODO: error handling
                console.log('done: ' + err);
            }
        });
    }

    /*
     * HTML manipulator
     */
    function addCommentWrapper(permalinkElement, commentData) {
        var wrapper,
            latestCommit,
            latestCommitUrl;
        if (commentData.commits.length) {
            latestCommit = commentData.commits.sort(function (a, b) {
                return new Date(a.commit.author.date) < new Date(b.commit.author.date);
            })[0];
        } else {
            latestCommit = commentData.commits;
        }
        latestCommitUrl = CONFIG.REPO_COMMIT_URL_ROOT + latestCommit.sha + '#all_commit_comments';
        wrapper = wrapperTemplate(latestCommit.sha,
                                  latestCommitUrl,
                                  commentData.comments.length,
                                  (location.pathname === '/' ||
                                   CONFIG.PAGINATION_SCHEME.test(location.pathname)));
        permalinkElement.parents('article').append(wrapper);
        $('a#talaria-show-' + latestCommit.sha).click(function (e) {
            e.preventDefault();
            $('div#talaria-wrap-' + latestCommit.sha + ' .talaria-comment-list-wrapper').fadeIn();
            $(this).hide();
        });
        $('a#talaria-add-' + latestCommit.sha).click(function () {
            if (CONFIG.LOCAL_STORAGE_SUPPORTED) {
                sessionStorage.removeItem(permalinkElement.get(0).href);
            }
        });
    }

    function addGistComments(permalink, gist) {
        var wrapper = wrapperTemplate(gist.id,
                                      gist.url,
                                      gist.comments.length,
                                      (location.pathname === '/' ||
                                       CONFIG.PAGINATION_SCHEME.test(location.pathname))),
            commentHtml = gist.comments.map(commentTemplate);
        permalink.parents('article').append(wrapper);
        permalink.parents('article').find('div.talaria-comment-list').prepend(commentHtml);
        // TODO: add click handlers!
    }

    /*
     * Initialization function
     */
    var initialize = function (config) {
        CONFIG = $.extend({}, DEFAULTS, config);
        CONFIG.GISTS_API_ENDPOINT = 'https://api.github.com/users/' + CONFIG.GITHUB_USERNAME + '/gists';
        CONFIG.COMMIT_API_ENDPOINT = 'https://api.github.com/repos/' + CONFIG.GITHUB_USERNAME + '/' + CONFIG.REPOSITORY_NAME + '/commits';
        CONFIG.REPO_COMMIT_URL_ROOT = 'https://github.com/' + CONFIG.GITHUB_USERNAME + '/' + CONFIG.REPOSITORY_NAME + '/commit/';
        CONFIG.PERMALINK_STYLE = setPermalinkRegex();

        ensureAsyncAvailable();

        $(document).ready(function () {
            if (localStorageSupported) {
                CONFIG.LOCAL_STORAGE_SUPPORTED = true;
            }

            $.ajaxSetup({
                accepts: {
                    json: 'application/vnd.github.v3.html+json'
                }
            });

            if (CONFIG.USE_GISTS) {
                retrieveGistBasedComments();
            } else {
                $(CONFIG.PERMALINK_IDENTIFIER).map(function () {
                    var permalink = this;
                    $.when(retrieveDataForPermalink(permalink.href)).then(function (data) {
                        if ($.isEmptyObject(data)) {
                            var parent = $(permalink).parents('article');
                            parent.find('div.talaria-load-error').show();
                            parent.find('div.talaria-comment-count').hide();
                        } else {
                            var commentsHtml = data.comments.sort(byAscendingDate).map(commentTemplate);
                            addCommentWrapper($(permalink), data);
                            $(permalink).parents('article').find('div.talaria-comment-list').prepend(commentsHtml);
                            cacheCommentData(permalink.href, data);
                        }
                    }, function (status) {
                        var parent = $(permalink).parents('article');
                        parent.find('div.talaria-load-error').text(
                            'The github API rate-limit has been reached. Unable to load comments.').show();
                        parent.find('div.talaria-comment-count').hide();
                    });
                });
            }
        });
    };

    return {
        init: initialize
    };
})($, async);
