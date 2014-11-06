/*global document,$,async,sessionStorage,location,console*/
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
            if (!CONFIG.USE_GISTS) {
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
                                    CONFIG.COMMENTABLE_CONTENT_PATH_PREFIX +
                                    '$1-$2-$3-$4' + CONFIG.CONTENT_SUFFIX);
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
    }

    function isStale(cachedCommentData) {
        return (new Date().getTime() -
                cachedCommentData.timestamp) > CONFIG.CACHE_TIMEOUT;
    }

    function maybeGetCachedVersion(url) {
        var cache;
        if (CONFIG.LOCAL_STORAGE_SUPPORTED) {
            cache = sessionStorage.getItem(url);
            if (cache) {
                cache = JSON.parse(cache);
                if (!isStale(cache)) {
                    return cache.commentData;
                }
            }
        }
        return undefined;
    }

    function latest(commits) {
        return commits.length > 0 ? commits.sort(function (a, b) {
            return new Date(a.committer.date) > new Date(b.committer.date);
        })[0] : undefined;
    }

    function pruneCommitData(commits) {
        return commits.map(function (c) {
            return {'sha': c.sha, 'committer': {'date': c.committer.date}};
        });
    }

    function ensureAsyncAvailable() {
        if (CONFIG.USE_GISTS && async === {}){
            throw new Error('talaria requires async.js' +
                            ' for Gist-based comments.');
        }
    }

    function updateConfig(config) {
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
    }

    /*
     * Templates
     */
    function wrapperTemplate(id, url, ccount, commentsHidden) {
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
    }

    function commentTemplate(comment) {
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
    }

    /*
     * github API interaction - Commit-based
     */
    function grabCommitsForFile(path, callback) {
        $.getJSON(CONFIG.COMMIT_API_ENDPOINT, {
            path: path
        }).then(function (commits) {
            callback(null, commits);
        }, function (error) {
            callback(error);
        });
    }

    function grabCommentsForCommit(acc, commit, callback) {
        if (commit.commit.comment_count > 0) {
            $.getJSON(CONFIG.COMMIT_API_ENDPOINT + '/' +
                      commit.sha + '/comments').
                then(function (comments) {
                    callback(null, acc.concat(comments));
                }, function (error) {
                    callback(error, acc);
                });
        } else {
            callback(null, acc);
        }
    }

    function aggregateComments(commits, callback) {
        async.reduce(commits, [], grabCommentsForCommit,
                     function (err, comments) {
            comments.sort(byAscendingDate);
            callback(err, commits, comments);
        });
    }

    function grabCommitComments(permalinkElement, cb) {
        var url = permalinkElement.href,
            path = extrapolatePathFromPermalink(url),
            cache = maybeGetCachedVersion(url);
        if (cache === undefined) {
            async.waterfall([
                function (callback) {
                    grabCommitsForFile(path, callback);
                },
                function (commits, callback) {
                    aggregateComments(commits, callback);
                }
            ], function (err, commits, comments) {
                if (err) {
                    cb(err);
                } else {
                    var cacheData = {'comments': comments, 'commits': pruneCommitData(commits)};
                    cacheCommentData(url, cacheData);
                    displayCommentsForCommits(permalinkElement, cacheData);
                    cb(null);
                }
            });
        } else {
            displayCommentsForCommits(permalinkElement, cache);
            cb(null);
        }
    }

    // TODO: ugly, improve
    function displayCommentsForCommits(permalinkElement, commitsAndComments) {
        var commits = commitsAndComments.commits,
            comments = commitsAndComments.comments,
            article = $(permalinkElement).parents('article'),
            wrapper;
        if (commits.length === 0) {
            wrapper = wrapperTemplate('', '', 0, false);
            article.append(wrapper);
            article.find('div.talaria-load-error').text(
                'Unable to find commits for this post.').removeClass('hide');
            article.find('div.talaria-comment-count').addClass('hide');
        } else {
            var lastCommit = latest(commits),
                latestCommitUrl = CONFIG.REPO_COMMIT_URL_ROOT +
                lastCommit.sha + '#all_commit_comments',
                commentHtml = comments.map(commentTemplate);
            wrapper = wrapperTemplate(lastCommit.sha,
                                      latestCommitUrl,
                                      comments.length,
                                      (location.pathname === '/' ||
                                       CONFIG.PAGINATION_SCHEME.test(location.pathname)));
            article.append(wrapper);
            $('#talaria-comment-list-' + lastCommit.sha).
                prepend(commentHtml);
            addClickHandlers(lastCommit.sha, permalinkElement.href, comments.length > 0);
        }
    }

    function retrieveCommitBasedComments() {
        async.eachLimit($(CONFIG.PERMALINK_IDENTIFIER), 5,
                        grabCommitComments, function (err) {
                            // possible errors: 403
                            // TODO: handle errors
        });
    }

    /*
     * github API interaction - Gist-based
     */
    function retrieveGistBasedComments() {
        var mappings = [],
            relevant = false,
            gist;
        // TODO: cache the mappings
        $.getJSON(CONFIG.GIST_MAPPINGS, function (gistMappings) {
            // TODO: optimize
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
            addGistComments(mappings);
        }).fail(function (error) {
            // Misconfiguration: either incorrect JSON or
            // mappings file not available
            var wrapper = wrapperTemplate('', '', 0, false);
            $(CONFIG.PERMALINK_IDENTIFIER).each(function () {
                    $(this).parents('article').append(wrapper);
            });
            $('div.talaria-wrapper div.talaria-load-error').text(
                'Unable to load comments.').removeClass('hide');
            $('div.talaria-wrapper div.talaria-comment-count').addClass('hide');
        });
    }

    function retrieveGistComments(mapping) {
        var gist = mapping.gist,
            cache = maybeGetCachedVersion(gist.permalink),
            dfd = new $.Deferred();

        if (cache !== undefined) {
            dfd.resolve(cache);
        } else {
            $.getJSON('https://api.github.com/gists/' + gist.id + '/comments',
                      function (comments) {
                          gist.comments = comments;
                          cacheCommentData(gist.permalink, gist);
                          dfd.resolve(gist);
                      }).
                fail(function (error) {
                    gist.comments = [];
                    dfd.reject(error, gist);
                });
        }
        return dfd.promise();
    }

    function handleGistMapping(mapping, callback) {
        retrieveGistComments(mapping).
            done(function (gist) {
                displayCommentsForGist(mapping.linkobj, gist);
                callback();
            }).
            fail(function (error, gist) {
                showErrorForGist(mapping.linkobj, error, gist);
                // we don't really need special error handling beyond this
                callback();
            });
    }

    function addGistComments(mappings) {
        async.eachLimit(mappings, 5, handleGistMapping, function (err) {
            if (err) {
                console.warn('Unable to map comments to articles: ' + err);
            }
        });
    }

    /*
     * HTML manipulator
     */
    function showErrorForGist(permalinkElement, error, gist) {
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
                    'The github API rate-limit has been reached. Unable to load comments.').removeClass('hide');
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
    }

    function addClickHandlers(id, url, hasComments) {
        $('a#talaria-show-' + id).click(function (e) {
            if (hasComments) {
                e.preventDefault();
                $('div#talaria-wrap-' + id + ' .talaria-comment-list-wrapper').fadeIn();
                $(this).addClass('hide');
            }
        });
        $('a#talaria-add-' + id).click(function () {
            if (CONFIG.LOCAL_STORAGE_SUPPORTED) {
                sessionStorage.removeItem(url);
            }
        });
    }

    function displayCommentsForGist(permalinkElement, gist) {
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
    }

    /*
     * Initialization function
     */
    var initialize = function (config) {
        updateConfig(config);
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
                retrieveCommitBasedComments();
            }
        });
    };

    return {
        init: initialize,
        test: {
            init: function (config) {
                updateConfig(config);
            },
            gists: retrieveGistBasedComments,
            commits: retrieveCommitBasedComments
        }
    };
})($, async);
