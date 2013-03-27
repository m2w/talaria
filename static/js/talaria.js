/*global document,$,sessionStorage,location*/

/*
 * A javascript wrapper around the github API that facilitates
 * a simple commit-comment based commenting system for static
 * content sites (e.g. github pages).
 */

/* 
 * Configuration 
 */
var REPOSITORY_NAME = 'm2w.github.com',
    GITHUB_USERNAME = 'm2w',
    COMMENTABLE_CONTENT_PATH_PREFIX = '_posts/',
    CONTENT_SUFFIX = '.md',
    LOCAL_STORAGE_SUPPORTED = false,
    CACHE_TIMEOUT = 10 * 60 * 1000, // cache github data for 10 minutes
    COMMENT_API_ENDPOINT = 'https://api.github.com/repos/' + GITHUB_USERNAME + '/' + REPOSITORY_NAME + '/comments',
    COMMIT_API_ENDPOINT = 'https://api.github.com/repos/' + GITHUB_USERNAME + '/' + REPOSITORY_NAME + '/commits',
    REPO_COMMIT_URL_ROOT = 'https://github.com/' + GITHUB_USERNAME + '/' + REPOSITORY_NAME + '/commit/';

/* 
 * Utilities 
 */

function extrapolatePathFromPermalink(permalink_url) {
    'use strict';
    return permalink_url.replace(/[\.\w\-_:\/]+\/(\d+)\/(\d+)\/(\d+)\/([\w\-_]+)$/,
        COMMENTABLE_CONTENT_PATH_PREFIX + '$1-$2-$3-$4' + CONTENT_SUFFIX);
}
function shortenCommitId(commit_id) {
    'use strict';
    return commit_id.substr(0, 7);
}
function localStorageSupported() {
    'use strict';
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
    'use strict';
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
var isStale = function (cached_comment_data) {
    'use strict';
    return (new Date().getTime() - cached_comment_data.timestamp) > CACHE_TIMEOUT;
};
var maybeGetCachedVersion = function(url) {
    'use strict';
    var cache = sessionStorage.getItem(url);
    if (cache) {
        cache = JSON.parse(cache);
        if (!isStale(cache)) {
            return cache.comment_data;
        }
    }
    return undefined;
};
/* 
 * github API interaction 
 */
var retrieveCommentsForCommit = function(commit) {
    'use strict';
    var dfd = new $.Deferred();
    $.getJSON(COMMIT_API_ENDPOINT + '/' + commit.sha + '/comments').done(function(comments) {
        dfd.resolveWith({ commits: commit, comments: comments });
    });
    return dfd;
};
var combineDataForFile = function(path, commits) {
    'use strict';
    var dfd = new $.Deferred(),
        deferred_comments = commits.map(function(commit) {
            return retrieveCommentsForCommit(commit).done(function() {
                this.path = path;
                return this;
            });
        });
    $.when.apply(null, deferred_comments).done(function() {
        var data = this,
            root;
        if (data && data.length) {
            root = { path: path, commits: [], comments: [] };
            data = data.reduce(function(acc, elem) {
                acc.commits = acc.commits.concat(elem.commits);
                acc.comments = acc.comments.concat(elem.comments);
                return acc;
            }, root);
        }
        dfd.resolveWith(data);
    });
    return dfd;
};
var getDataForPathWithDeferred = function(path, dfd) {
    'use strict';
    $.getJSON(COMMIT_API_ENDPOINT, { path: path }).then(function(commits) {
        return combineDataForFile(path, commits);
    }).done(function() {
        dfd.resolveWith(this);
    });
};
// returns a deferred object which holds all necessary commit and comment information for a specific permalink
var retrieveDataForPermalink = function(url) {
    'use strict';
    var wrapper_dfd = new $.Deferred(),
        path = extrapolatePathFromPermalink(url),
        cache;
    if (LOCAL_STORAGE_SUPPORTED) {
        cache = maybeGetCachedVersion(url);
        if (cache) {
            wrapper_dfd.resolveWith(cache);
        } else {
            getDataForPathWithDeferred(path, wrapper_dfd);
        }
    } else {
        getDataForPathWithDeferred(path, wrapper_dfd);
    }
    return wrapper_dfd;
};
/* 
 * HTML generators 
 */
var generateHtmlForComments = function(comment) {
    'use strict';
    var now = new Date().getTime(),
        template_clone = $('#comment-template').clone(),
        header = template_clone.find('div.comment-header');
    template_clone.find('img').attr('src', comment.user.avatar_url);
    header.find('b').text(comment.user.login);
    header.find('a.profile-link').attr('href', comment.user.html_url);
    header.find('a.changeset-link').attr('href', comment.html_url);
    header.find('code.sha').text(shortenCommitId(comment.commit_id));
    header.find('span.time').text(timeDifference(now, new Date(comment.updated_at)));
    template_clone.find('div.comment-body').html(comment.body_html);
    template_clone.attr('id', comment.id).addClass('comment');
    template_clone.show();
    return template_clone;
};
/* 
 * HTML manipulators 
 */
var updateCommentMeta = function(permalink_element, comment_data) {
    'use strict';
    var wrapper = permalink_element.parents('article').find('div.comments-wrapper'),
        latest_commit,
        latest_commit_url,
        c,
        text;
    if (comment_data.commits.length) {
        latest_commit = comment_data.commits.sort(function(a, b) {
            return new Date(a.commit.author.date) < new Date(b.commit.author.date);
        })[0];
    } else {
        latest_commit = comment_data.commits;
    }
    latest_commit_url = REPO_COMMIT_URL_ROOT + latest_commit.sha + '#all_commit_comments';
    wrapper.find('a.github-comments-link').attr('href', latest_commit_url);
    if (comment_data.comments.length > 0) {
        // check if currently displaying paginated content
        if (location.pathname === "/" || /\/page\d+\//.test(location.pathname)) {
            c = comment_data.comments.length;
            text = c + ' comment' + (c !== 1 ? 's' : '');
            wrapper.find('div.comment-count a').attr('href', latest_commit_url)
                .click(function(e) {
                    e.preventDefault();
                    wrapper.find('div.comments').fadeIn();
                    wrapper.find('div.comments-header').show();
                    $(this).hide();
                }).text(text);
        } else {
            wrapper.find('div.comments-header').show();
            wrapper.find('div.comments').show();
        }
    } else {
        wrapper.find('div.comment-count a').attr('href', latest_commit_url).text('Be the first to comment');
        wrapper.find('div.comments a.add-comment-link').hide();
    }
    wrapper.find('div.comments a.add-comment-link').attr('href', latest_commit_url).click(function(e){
        if (LOCAL_STORAGE_SUPPORTED) {
            sessionStorage.removeItem(permalink_element.get(0).href);
        }
    });
};

$(document).ready(function() {
    'use strict';

    // check for local storage support
    if (localStorageSupported) {
        LOCAL_STORAGE_SUPPORTED = true;
    }

    // ensure that github returns fully rendered markup
    $.ajaxSetup({
        accepts: { json: 'application/vnd.github.beta.html+json' }
    });

    // iterate over permalinks and retrieve relevant commit and comment data
    $('a.permalink').map(function() {
        var permalink = this;
        $.when(retrieveDataForPermalink(permalink.href)).then(function() {
            var commentHtml = this.comments.sort(byAscendingDate).map(generateHtmlForComments);
            updateCommentMeta($(permalink), this);
            $(permalink).parents('article').find('div.comments-wrapper div.comments').prepend(commentHtml);

            if (LOCAL_STORAGE_SUPPORTED) {
                sessionStorage.setItem(permalink.href, JSON.stringify({timestamp: new Date().getTime(), comment_data: this}));
            }
        });
    });
});