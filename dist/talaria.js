/*global document,$,sessionStorage,location*/
var talaria = (function ($) {
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
            PERMALINK_IDENTIFIER: 'a.permalink'
        };

    /*
     * Utilities
     */
    function extrapolatePathFromPermalink(permalink_url) {
        return permalink_url.replace(/[\.\w\-_:\/]+\/(\d+)\/(\d+)\/(\d+)\/([\w\-_\.]+)$/,
            CONFIG.COMMENTABLE_CONTENT_PATH_PREFIX + '$1-$2-$3-$4' + CONFIG.CONTENT_SUFFIX);
    }

    function shortenCommitId(commit_id) {
        return commit_id.substr(0, 7);
    }

    function localStorageSupported() {
        try {
            sessionStorage.setItem("dummy", "dummy");
            sessionStorage.removeItem("dummy");
            return true;
        } catch (e) {
            return false;
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

    function isStale(cached_comment_data) {
        return (new Date().getTime() - cached_comment_data.timestamp) > CONFIG.CACHE_TIMEOUT;
    }

    function maybeGetCachedVersion(url) {
        var cache = sessionStorage.getItem(url);
        if (cache) {
            cache = JSON.parse(cache);
            if (!isStale(cache)) {
                return cache.comment_data;
            }
        }
        return undefined;
    }

    /*
     * github API interaction
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
            deferred_comments = commits.map(function (commit) {
                return retrieveCommentsForCommit(commit, path);
            });
        $.when.apply($, deferred_comments).done(function () {
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
     * HTML generator
     */
    function generateHtmlForComments(comment) {
        var now = new Date().getTime(),
            template_clone = $('#talaria-comment-placeholder').clone(),
            header = template_clone.find('div.talaria-comment-header');
        template_clone.find('span.talaria-img-placeholder').replaceWith(
            '<img class="talaria-comment-author-avatar" height="48" width="48" src="' + comment.user.avatar_url + '" />');
        header.find('b').text(comment.user.login);
        header.find('a.talaria-author-nick').attr('href', comment.user.html_url);
        header.find('a.talaria-commit-sha').attr('href', comment.html_url).html(
            '<code>' + shortenCommitId(comment.commit_id) + '</code>');
        header.find('span.talaria-header-right').text(timeDifference(now, new Date(comment.updated_at)));
        template_clone.find('div.talaria-comment-body').html(comment.body_html);
        template_clone.attr('id', comment.id).show();
        return template_clone;
    }

    /*
     * HTML manipulator
     */
    function updateCommentMeta(permalink_element, comment_data) {
        var wrapper = permalink_element.parents('article').find('div.talaria-wrapper'),
            latest_commit,
            latest_commit_url,
            c,
            text;
        if (comment_data.commits.length) {
            latest_commit = comment_data.commits.sort(function (a, b) {
                return new Date(a.commit.author.date) < new Date(b.commit.author.date);
            })[0];
        } else {
            latest_commit = comment_data.commits;
        }
        latest_commit_url = CONFIG.REPO_COMMIT_URL_ROOT + latest_commit.sha + '#all_commit_comments';
        wrapper.find('a.talaria-last-commit-href').attr('href', latest_commit_url);
        if (comment_data.comments.length > 0) {
            // check if currently displaying paginated content
            if (location.pathname === "/" || CONFIG.PAGINATION_SCHEME.test(location.pathname)) {
                c = comment_data.comments.length;
                text = c + ' comment' + (c !== 1 ? 's' : '');
                wrapper.find('a.talaria-expand-comments').attr('href', latest_commit_url).click(function (e) {
                    e.preventDefault();
                    wrapper.find('div.talaria-comment-list-wrapper').fadeIn();
                    $(this).hide();
                }).text(text);
            } else {
                wrapper.find('div.talaria-comment-count').hide();
                wrapper.find('div.talaria-comment-list-wrapper').fadeIn();
            }
        } else {
            wrapper.find('a.talaria-expand-comments').attr('href', latest_commit_url).text('Be the first to comment');
        }
        wrapper.find('a.talaria-add-comment-button').attr('href', latest_commit_url).click(function () {
            if (CONFIG.LOCAL_STORAGE_SUPPORTED) {
                sessionStorage.removeItem(permalink_element.get(0).href);
            }
        });
    }

    /*
     * Initialization function
     */
    var initialize = function (config) {
        CONFIG = $.extend({}, DEFAULTS, config);
        CONFIG.COMMIT_API_ENDPOINT = 'https://api.github.com/repos/' + CONFIG.GITHUB_USERNAME + '/' + CONFIG.REPOSITORY_NAME + '/commits';
        CONFIG.REPO_COMMIT_URL_ROOT = 'https://github.com/' + CONFIG.GITHUB_USERNAME + '/' + CONFIG.REPOSITORY_NAME + '/commit/';

        $(document).ready(function () {
            if (localStorageSupported) {
                CONFIG.LOCAL_STORAGE_SUPPORTED = true;
            }

            $.ajaxSetup({
                accepts: {
                    json: 'application/vnd.github.v3.html+json'
                }
            });

            $(CONFIG.PERMALINK_IDENTIFIER).map(function () {
                var permalink = this;
                $.when(retrieveDataForPermalink(permalink.href)).then(function (data) {
                    if ($.isEmptyObject(data)) {
                        var parent = $(permalink).parents('article');
                        parent.find('div.talaria-load-error').show();
                        parent.find('div.talaria-comment-count').hide();
                    } else {
                        var commentHtml = data.comments.sort(byAscendingDate).map(generateHtmlForComments);
                        updateCommentMeta($(permalink), data);
                        $(permalink).parents('article').find('div.talaria-comment-list').prepend(commentHtml);
                        if (CONFIG.LOCAL_STORAGE_SUPPORTED) {
                            sessionStorage.setItem(permalink.href, JSON.stringify({
                                timestamp: new Date().getTime(),
                                comment_data: data
                            }));
                        }
                    }
                }, function (status) {
                    var parent = $(permalink).parents('article');
                    parent.find('div.talaria-load-error').text(
                        'You have exceeded the github API request limit. Could not retrieve the comments.').show();
                    parent.find('div.talaria-comment-count').hide();
                });
            });
        });
    };

    var ping = function (ping_endpoint) {
        $.get(ping_endpoint);
    };

    return {
        init: initialize,
        ping: ping
    };
})($);
