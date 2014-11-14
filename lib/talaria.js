/*global $,P,sessionStorage,location*/
var talaria = (function ($, P) {
    'use strict';

    /*
     * Default configuration
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
    var setPermalinkRegex = function() {
        switch (CONFIG.PERMALINK_STYLE) {
        case 'pretty':
            return /[\.\w\-_:\/]+\/(\d+)\/(\d+)\/(\d+)\/([\w\-\.]+)\/$/;
        case 'date':
            return /[\.\w\-_:\/]+\/(\d+)\/(\d+)\/(\d+)\/([\w\-\.]+)\.html$/;
        case 'none':
            if (!CONFIG.USE_GISTS) {
                throw new Error('When using commit-based comments,' +
                                ' talaria requires the use of' +
                                ' permalinks that include the date' +
                                ' of the post');
            }
            return /[\.\w\-_:\/]+\/([\w\-\.]+)\.html$/;
        default: return CONFIG.PERMALINK_STYLE;
        }
    };

    var extrapolatePathFromPermalink = function(permalinkUrl) {
        return permalinkUrl.replace(CONFIG.PERMALINK_STYLE,
                                    CONFIG.COMMENTABLE_CONTENT_PATH_PREFIX +
                                    '$1-$2-$3-$4' + CONFIG.CONTENT_SUFFIX);
    };

    var shortenCommitId = function(commitId) {
        return commitId.substr(0, 7);
    };

    var localStorageSupported = function() {
        try {
            sessionStorage.setItem('dummy', 'dummy');
            sessionStorage.removeItem('dummy');
            return true;
        } catch (e) {
            return false;
        }
    };

    var isStale = function(cachedCommentData) {
        return (new Date().getTime() -
                cachedCommentData.timestamp) > CONFIG.CACHE_TIMEOUT;
    };

    var maybeGetCachedVersion = function(url) {
        var cache;
        if (CONFIG.LOCAL_STORAGE_SUPPORTED) {
            cache = sessionStorage.getItem(url);
            if (cache) {
                cache = JSON.parse(cache);
                if (!isStale(cache)) {
                    return P.resolve(cache.commentData);
                }
            }
        }
        return P.reject('cache miss');
    };

    var cacheCommentData = function(key, data) {
        if (CONFIG.LOCAL_STORAGE_SUPPORTED) {
            sessionStorage.setItem(key, JSON.stringify({
                timestamp: new Date().getTime(),
                commentData: data
            }));
        }
    };

    var latest = function(commits) {
        return commits.length > 0 ? commits.sort(function (a, b) {
            return new Date(a.commit.committer.date) > new Date(b.commit.committer.date);
        })[0] : undefined;
    };

    /*
     * timeDifference is taken from:
     * http://stackoverflow.com/questions/6108819/javascript-timestamp-to-relative-time-eg-2-seconds-ago-one-week-ago-etc-best
     * tweaks by me
     */
    var timeDifference = function(current, previous) {
        var maybePluralize = function(elapsed) {
            return elapsed === 1 ? '' : 's';
        };
        var msPerMinute = 60 * 1000,
            msPerHour = msPerMinute * 60,
            msPerDay = msPerHour * 24,
            msPerMonth = msPerDay * 30,
            msPerYear = msPerDay * 365,
            justNowLim = 15 * 1000,
            elapsed = current - previous,
            t = 0;
        if (elapsed < msPerMinute) {
            return elapsed < justNowLim ?
                ' just now' : Math.round(elapsed / 1000) + ' seconds ago';
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
    };

    var addClickHandlers = function(wrapperId, url, hasComments) {
        $('a#talaria-show-' + wrapperId).click(function (e) {
            if (hasComments) {
                e.preventDefault();
                $('div#talaria-wrap-' + wrapperId + ' .talaria-comment-list-wrapper').fadeIn();
                $(this).addClass('hide');
            }
        });
        $('a#talaria-add-' + wrapperId).click(function () {
            if (CONFIG.LOCAL_STORAGE_SUPPORTED) {
                sessionStorage.removeItem(url);
            }
        });
    };

    /*
     * Custom Errors
     */
    function RateLimitedError (msg) {
        this.name = 'RateLimitedError';
        this.message = msg || 'Rate-Limit exceeded.';
    }
    RateLimitedError.prototype = Object.create(Error.prototype);
    RateLimitedError.prototype.constructor = RateLimitedError;

    function NotFoundError (msg) {
        this.name = 'NotFoundError';
        this.message = msg || 'Object not found.';
    }
    NotFoundError.prototype = Object.create(Error.prototype);
    NotFoundError.prototype.constructor = NotFoundError;

    /*
     * Error Predicates
     */
    function isRateLimited(e) {
        return e.status === 403;
    }

    /*
     * HTML Templates
     */
    var wrapperTemplate = function(id, url, ccount, commentsHidden) {
        commentsHidden = ccount === 0 || commentsHidden;
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
            '    <div class="talaria-comment-list" id="talaria-comment-list-' + id + '">' +
            '      <!-- comments are dynamically added here -->' +
            '    </div>' +
            '    <div class="talaria-align-right">' +
            '      <a id="talaria-add-' + id + '" class="talaria-add-comment-button" href="' + url + '">' +
            '        <button type="submit">Add a Comment</button>' +
            '      </a>' +
            '    </div>' +
            '  </div>' +
            '</div>';
    };

    var commentTemplate = function(comment) {
        var now = new Date().getTime(),
            headerLeft;

        if (comment.commit_id !== undefined) {
            headerLeft = '<span class="talaria-header-left">&nbsp;commented on <a class="talaria-commit-sha" href="' + comment.html_url + '">' +
                '<code>' + shortenCommitId(comment.commit_id) + '</code></a></span>';
        } else {
            headerLeft = '<span class="talaria-header-left">&nbsp;wrote</span>';
        }

        return '<div id="' + comment.id + '" class="talaria-comment-bubble">' +
            '  <a class="talaria-author-nick" href="' + comment.user.html_url + '">' +
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
    };

    /*
     * Github API interaction - Commit-based
     */
    var retrieveCommitBasedComments = function() {
        return grabPermalinks().map(function (permalink) {
            var p = permalink;

            return maybeGetCachedVersion(p.url).then(function (comments) {
                displayCommentsForCommits(p, cacheData);
                return comments;
            }).catch(function () {
                // cache miss
                return grabCommitsForFile(permalink).
                    reduce(function (acc, commit) {
                        return grabCommentsForCommit(commit).then(function (comments) {
                            acc.comments = acc.comments.concat(comments);
                            acc.commits.push({sha: commit.sha, commit: {committer: {date: commit.commit.committer.date}}});
                            return acc;
                        });
                    }, {comments: [], commits: []}).then(function (data) {
                        var cacheData = {'comments': data.comments, 'commits': data.commits};
                        cacheCommentData(p.url, cacheData);
                        displayCommentsForCommits(p, cacheData);
                        return data.comments;
                    }).catch(RateLimitedError, function () {
                        var article = $(p).parents('article'),
                            wrapper = wrapperTemplate('', '', 0, false);

                        article.append(wrapper);
                        article.find('div.talaria-load-error').text(
                            'The Github API rate-limit has been reached. Unable to load comments.').removeClass('hide');
                        article.find('div.talaria-comment-count').addClass('hide');
                    }).catch(NotFoundError, function () {
                        var article = $(p).parents('article'),
                            wrapper = wrapperTemplate('', '', 0, false);

                        article.append(wrapper);
                        article.find('div.talaria-load-error').text(
                            'Unable to find commits for this post.').removeClass('hide');
                        article.find('div.talaria-comment-count').addClass('hide');
                    });
            });
        }, {concurrency: 2});
    };

    var grabPermalinks = function () {
        var links = [];

        $(CONFIG.PERMALINK_IDENTIFIER).each(function (idx, el) {
            links.push(el);
        });
        return P.resolve(links);
    };

    var grabCommitsForFile = function(permalink) {
        var p = extrapolatePathFromPermalink(permalink.href);

        return P.resolve($.getJSON(CONFIG.COMMIT_API_ENDPOINT, {
            path: p
        })).then(function (commits) {
            if (commits.length === 0) {
                throw new NotFoundError();
            }
            return P.resolve(commits);
        }).catch(isRateLimited, function () {
            throw new RateLimitedError();
        });
    };

    var grabCommentsForCommit = function(commit) {
        if (commit.commit.comment_count > 0) {
            return P.resolve($.getJSON(CONFIG.COMMIT_API_ENDPOINT + '/' +
                                       commit.sha + '/comments')).
                then(function (comments) {
                    return comments;
                }).catch(isRateLimited, function () {
                    throw new RateLimitedError();
                }).catch(function () {
                    return [];
                });
        }
        return [];
    };

    var displayCommentsForCommits = function(permalinkElement, commitsAndComments) {
        var comments = commitsAndComments.comments,
            lastCommit = latest(commitsAndComments.commits),
            latestCommitUrl = CONFIG.REPO_COMMIT_URL_ROOT +
            lastCommit.sha + '#all_commit_comments',
            wrapper = wrapperTemplate(lastCommit.sha,
                                      latestCommitUrl,
                                      comments.length,
                                      (location.pathname === '/' ||
                                       CONFIG.PAGINATION_SCHEME.test(location.pathname))),
            commentHtml = comments.map(commentTemplate);

        $(permalinkElement).parents('article').append(wrapper);
        $('#talaria-comment-list-' + lastCommit.sha).
            prepend(commentHtml);
        addClickHandlers(lastCommit.sha, permalinkElement.href, comments.length > 0);
    };

    /*
     * Github API interaction - Gist-based
     */
    var retrieveGistBasedComments = function() {
        return P.resolve($.getJSON(CONFIG.GIST_MAPPINGS)).
            then(function (gistMappings) {
                return getRelevantMappings(gistMappings);
            }).map(function (mapping) {
                var gist = mapping.gist;

                return maybeGetCachedVersion(gist.permalink).
                    catch(function () {
                        // cache miss
                        return getGistComments(gist);
                    }).then(function (gist) {
                        displayCommentsForGist(mapping.linkobj, gist);
                        return gist;
                    }).catch(function (error) {
                        // 404 or 403
                        gist.comments = [];
                        showErrorForGist(mapping.linkobj, error, gist);
                        return gist;
                    });
            }, {concurrency: 2}).catch(function () {
                showGistMappingsError();
                return [];
            });
    };

    var getGistComments = function (gist) {
        return P.resolve($.getJSON('https://api.github.com/gists/' + gist.id + '/comments')).
            then(function (comments) {
                gist.comments = comments;
                cacheCommentData(gist.permalink, gist);
                return gist;
            });
    };

    var getRelevantMappings = function (gistMappings) {
        var mappings = [],
            relevant = false,
            gist;

        for (var entry in gistMappings) {
            if (gistMappings.hasOwnProperty(entry)) {
                gist = gistMappings[entry];
                var permalink = $(CONFIG.PERMALINK_IDENTIFIER +
                                  '[href="' + gist.permalink + '"]');
                relevant = permalink.length > 0;
                if (relevant) {
                    mappings.push({'gist':gistMappings[entry],
                                   'linkobj': permalink});
                }
            }
        }
        return mappings;
    };

    var showGistMappingsError = function () {
        var wrapper = wrapperTemplate('', '', 0, false);
        $(CONFIG.PERMALINK_IDENTIFIER).each(function () {
            $(this).parents('article').append(wrapper);
        });
        $('div.talaria-wrapper div.talaria-load-error').text(
            'Unable to load comments.').removeClass('hide');
        $('div.talaria-wrapper div.talaria-comment-count').addClass('hide');
    };

    var showErrorForGist = function(permalinkElement, error, gist) {
        var gistUrl = CONFIG.GIST_URL_ROOT + gist.id + '#comments',
            wrapper = wrapperTemplate(gist.id,
                                      gistUrl,
                                      gist.comments.length,
                                      (location.pathname === '/' ||
                                       CONFIG.PAGINATION_SCHEME.test(location.pathname)));

        permalinkElement.parents('article').append(wrapper);
        switch (error.status) {
            case 403:
                $('#talaria-wrap-' + gist.id + ' div.talaria-load-error').text(
                    'The Github API rate-limit has been reached. Unable to load comments.').removeClass('hide');
                $('#talaria-wrap-' + gist.id + ' div.talaria-comment-count').addClass('hide');
                break;
            case 404:
                $('#talaria-wrap-' + gist.id + ' div.talaria-load-error').text(
                    'Unable to find a matching gist.').removeClass('hide');
                $('#talaria-wrap-' + gist.id + ' div.talaria-comment-count').addClass('hide');
                break;
            default:
                $('#talaria-wrap-' + gist.id + ' div.talaria-load-error').text(
                    'An error occurred retrieving comments for this post.').removeClass('hide');
                $('#talaria-wrap-' + gist.id + ' div.talaria-comment-count').addClass('hide');
        }
    };

    var displayCommentsForGist = function(permalinkElement, gist) {
        var gistUrl = CONFIG.GIST_URL_ROOT + gist.id + '#comments',
            wrapper = wrapperTemplate(gist.id,
                                      gistUrl,
                                      gist.comments.length,
                                      (location.pathname === '/' ||
                                       CONFIG.PAGINATION_SCHEME.test(location.pathname))),
            commentHtml = gist.comments.map(commentTemplate);

        permalinkElement.parents('article').append(wrapper);
        $('#talaria-comment-list-' + gist.id).prepend(commentHtml);
        addClickHandlers(gist.id, gist.permalink, gist.comments.length > 0);
    };

    /*
     * Configuration and Initialization
     */
    var updateConfig = function(config) {
        CONFIG = $.extend({}, DEFAULTS, config);
        CONFIG.GISTS_API_ENDPOINT = 'https://api.github.com/users/' +
            CONFIG.GITHUB_USERNAME + '/gists';
        CONFIG.COMMIT_API_ENDPOINT = 'https://api.github.com/repos/' +
            CONFIG.GITHUB_USERNAME + '/' + CONFIG.REPOSITORY_NAME + '/commits';
        CONFIG.REPO_COMMIT_URL_ROOT = 'https://github.com/' +
            CONFIG.GITHUB_USERNAME + '/' + CONFIG.REPOSITORY_NAME + '/commit/';
        CONFIG.GIST_URL_ROOT = 'https://gist.github.com/' +
            CONFIG.GITHUB_USERNAME + '/';
        CONFIG.PERMALINK_STYLE = setPermalinkRegex();
    };

    var initialize = function (config) {
        updateConfig(config);

        if (localStorageSupported) {
            CONFIG.LOCAL_STORAGE_SUPPORTED = true;
        }

        $.ajaxSetup({
            accepts: {
                json: 'application/vnd.github.v3.html+json'
            }
        });

        if (CONFIG.USE_GISTS) {
            return retrieveGistBasedComments();
        } else {
            return retrieveCommitBasedComments();
        }
    };

    /*
     * Public API
     */
    return {
        init: initialize
    };
})($, P);
