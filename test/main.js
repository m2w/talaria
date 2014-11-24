// extend is taken from http://youmightnotneedjquery.com/#deep_extend
// with a minor fix, see https://github.com/HubSpot/youmightnotneedjquery/issues/66
var extend = function(out) {
    out = out || {};

    for (var i = 1; i < arguments.length; i++) {
        var obj = arguments[i];

        if (!obj)
            continue;

        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object')
                    out[key] = extend(out[key], obj[key]);
                else
                    out[key] = obj[key];
            }
        }
    }

    return out;
};

var expect = chai.expect,
    singleCommentResponse = JSON.stringify(
    [{"id": 1,
      "url": "https://api.github.com/gists/ab21536bde9abe8dc3e8/comments/1",
      "body": "Just commenting for the sake of commenting",
      "user": {
          "login": "octocat",
          "id": 1,
          "avatar_url": "https://github.com/images/error/octocat_happy.gif",
          "gravatar_id": "",
          "url": "https://api.github.com/users/octocat",
          "html_url": "https://github.com/octocat",
          "followers_url": "https://api.github.com/users/octocat/followers",
          "following_url": "https://api.github.com/users/octocat/following{/other_user}",
          "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
          "organizations_url": "https://api.github.com/users/octocat/orgs",
          "repos_url": "https://api.github.com/users/octocat/repos",
          "events_url": "https://api.github.com/users/octocat/events{/privacy}",
          "received_events_url": "https://api.github.com/users/octocat/received_events",
          "type": "User",
          "site_admin": false
      },
      "created_at": "2011-04-18T23:23:56Z",
      "updated_at": "2011-04-18T23:23:56Z"}]),
    rateLimitedResponse = JSON.stringify(
        {"message": "API rate limit exceeded for 127.0.0.1. (But here's the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.)",
         "documentation_url": "https://developer.github.com/v3/#rate-limiting"}),
    simpleMappingsResponse = JSON.stringify(
        {"test1.md": {"permalink": "/test/200", "id": "single"},
         "test2.md": {"permalink": "/test/404", "id":"nonexistant"},
         "test3.md": {"permalink": "/test/403", "id":"ratelimited"}}

    ),
    notFoundResponse = JSON.stringify(
        {"message": "Not Found",
         "documentation_url": "https://developer.github.com/v3"}
    ),
    commit1 = {
        "url": "https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e",
        "sha": "asdf123",
        "html_url": "https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e",
        "comments_url": "https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e/comments",
        "commit": {
            "url": "https://api.github.com/repos/octocat/Hello-World/git/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e",
            "author": {
                "name": "Monalisa Octocat",
                "email": "support@github.com",
                "date": "2011-04-14T16:00:49Z"
            },
            "committer": {
                "name": "Monalisa Octocat",
                "email": "support@github.com",
                "date": "2011-04-14T16:00:49Z"
            },
            "message": "Fix all the bugs",
            "tree": {
                "url": "https://api.github.com/repos/octocat/Hello-World/tree/6dcb09b5b57875f334f61aebed695e2e4193db5e",
                "sha": "6dcb09b5b57875f334f61aebed695e2e4193db5e"
            },
            "comment_count": 1
        },
        "author": {
            "login": "octocat",
            "id": 1,
            "avatar_url": "https://github.com/images/error/octocat_happy.gif",
            "gravatar_id": "",
            "url": "https://api.github.com/users/octocat",
            "html_url": "https://github.com/octocat",
            "followers_url": "https://api.github.com/users/octocat/followers",
            "following_url": "https://api.github.com/users/octocat/following{/other_user}",
            "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
            "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
            "organizations_url": "https://api.github.com/users/octocat/orgs",
            "repos_url": "https://api.github.com/users/octocat/repos",
            "events_url": "https://api.github.com/users/octocat/events{/privacy}",
            "received_events_url": "https://api.github.com/users/octocat/received_events",
            "type": "User",
            "site_admin": false
        },
        "committer": {
            "login": "octocat",
            "id": 1,
            "avatar_url": "https://github.com/images/error/octocat_happy.gif",
            "gravatar_id": "",
            "url": "https://api.github.com/users/octocat",
            "html_url": "https://github.com/octocat",
            "followers_url": "https://api.github.com/users/octocat/followers",
            "following_url": "https://api.github.com/users/octocat/following{/other_user}",
            "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
            "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
            "organizations_url": "https://api.github.com/users/octocat/orgs",
            "repos_url": "https://api.github.com/users/octocat/repos",
            "events_url": "https://api.github.com/users/octocat/events{/privacy}",
            "received_events_url": "https://api.github.com/users/octocat/received_events",
            "type": "User",
            "site_admin": false
        },
        "parents": [
            {
                "url": "https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e",
                "sha": "6dcb09b5b57875f334f61aebed695e2e4193db5e"
            }
        ]
    },
    commit2 = extend({}, commit1),
    singleCommitResponse = JSON.stringify([commit1]),
    multipleCommitsResponse = JSON.stringify([commit1, (function update() {
        commit2.sha = 'asdf124';
        return commit2;
    })()]),
    commitCommentsResponse = JSON.stringify(
        [
            {
                "html_url": "https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e#commitcomment-1",
                "url": "https://api.github.com/repos/octocat/Hello-World/comments/1",
                "id": 1,
                "body": "Great stuff",
                "path": "file1.txt",
                "position": 4,
                "line": 14,
                "commit_id": "6dcb09b5b57875f334f61aebed695e2e4193db5e",
                "user": {
                    "login": "octocat",
                    "id": 1,
                    "avatar_url": "",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/octocat",
                    "html_url": "https://github.com/octocat",
                    "followers_url": "https://api.github.com/users/octocat/followers",
                    "following_url": "https://api.github.com/users/octocat/following{/other_user}",
                    "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
                    "organizations_url": "https://api.github.com/users/octocat/orgs",
                    "repos_url": "https://api.github.com/users/octocat/repos",
                    "events_url": "https://api.github.com/users/octocat/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/octocat/received_events",
                    "type": "User",
                    "site_admin": false
                },
                "created_at": "2011-04-14T16:00:49Z",
                "updated_at": "2011-04-14T16:00:49Z"
            }
        ]
    );

describe('talaria with USE_GISTS = true', function () {
    before(function () {
        server = sinon.fakeServer.create();
        server.autoRespond = true;
        server.respondWith("/mappings-missing.json",
                           [404, {"Content-Type": "text/html"},
                            "File not found"]);
        server.respondWith("/mappings.json",
                           [200, {"Content-Type": "application/json"},
                            simpleMappingsResponse]);
        server.respondWith(/ratelimited/,
                           [403, {"X-RateLimit-Remaining": 0},
                            rateLimitedResponse]);
        server.respondWith(/nonexistant/,
                           [404, {},
                            notFoundResponse]);
        server.respondWith(/single/,
                           [200, {},
                            singleCommentResponse]);
    });
    after(function () {
        server.restore();
    });
    afterEach(function () {
        var w = document.querySelector('div.talaria-wrapper');
        w.parentNode.removeChild(w);
    });
    it('should display an error when unable to load the gist<=>post mappings',
       function () {
           return talaria.init({USE_GISTS: true, GITHUB_USERNAME: 'm2w',
                         GIST_MAPPINGS: '/missing-mappings.json'}).
               then(function (){
                   var errorNode = document.querySelector('div.talaria-wrapper div.talaria-load-error');
                   expect(errorNode.classList.contains('hide')).to.be.false;
                   expect(errorNode.textContent).to.equal('Unable to load comments.');

                   var commentNodes = document.querySelectorAll('div.talaria-wrapper div.talaria-comment-bubble');
                   expect(commentNodes).to.have.length(0);
               });
       });
    it('should display an error message when unable to locate a gist', function () {
        document.querySelector('a.permalink').setAttribute('href','/test/404');
        return talaria.init({USE_GISTS: true, GITHUB_USERNAME: 'm2w',
                      GIST_MAPPINGS: '/mappings.json'}).
            then(function () {
                var errorNode = document.querySelector('div.talaria-wrapper div.talaria-load-error');
                expect(errorNode.classList.contains('hide')).to.be.false;
                expect(errorNode.textContent).to.equal('Unable to find a matching gist.');

                var commentNodes = document.querySelectorAll('div.talaria-wrapper div.talaria-comment-bubble');
                expect(commentNodes).to.have.length(0);
            });
    });
    it('should display an error message when exceeding GitHub API rate-limit',
       function () {
           document.querySelector('a.permalink').setAttribute('href','/test/403');
           return talaria.init({USE_GISTS: true, GITHUB_USERNAME: 'm2w',
                         GIST_MAPPINGS: '/mappings.json'}).
               then(function () {
                   var errorNode = document.querySelector('div.talaria-wrapper div.talaria-load-error');
                   expect(errorNode.classList.contains('hide')).to.be.false;
                   expect(errorNode.textContent).to.equal('The Github API rate-limit has been reached. Unable to load comments.');

                   var commentNodes = document.querySelectorAll('div.talaria-wrapper div.talaria-comment-bubble');
                   expect(commentNodes).to.have.length(0);
               });
       });
    it('should retrieve and display all comments for a post', function () {
        document.querySelector('a.permalink').setAttribute('href','/test/200');
        return talaria.init({USE_GISTS: true, GITHUB_USERNAME: 'm2w',
                      GIST_MAPPINGS: '/mappings.json'}).
            then(function () {
                var errorNode = document.querySelector('div.talaria-wrapper div.talaria-load-error');
                expect(errorNode.classList.contains('hide')).to.be.true;

                var commentNodes = document.querySelectorAll('div.talaria-wrapper div.talaria-comment-bubble');
                expect(commentNodes).to.have.length(1);
            });
    });
    it('should cache any API interaction results', function () {
        document.querySelector('a.permalink').setAttribute('href', '/test/200');

        var store = {};

        sinon.stub(sessionStorage, 'getItem', function (key) {
            return store[key];
        });
        sinon.stub(sessionStorage, 'setItem', function (key, value) {
            return store[key] = value + '';
        });
        sinon.stub(sessionStorage, 'removeItem', function (key) {
            delete store[key];
            return store;
        });

        return talaria.init({USE_GISTS: true, GITHUB_USERNAME: 'm2w',
                             GIST_MAPPINGS: '/mappings.json'}).
            then(function () {
                var stored = JSON.parse(store['/test/200']);
                expect(stored).to.be.an('object');
                expect(stored.commentData.comments).to.have.length(1);
                sessionStorage.removeItem.restore();
                sessionStorage.getItem.restore();
                sessionStorage.setItem.restore();
            });
    });
});
describe('talaria with USE_GISTS = false', function () {
    before(function () {
        server = sinon.fakeServer.create();
        server.autoRespond = true;
        server.respondWith(/ratelimited/,
                           [403, {"X-RateLimit-Remaining": 0},
                            rateLimitedResponse]);
        server.respondWith(/nonexistant/,
                           [200, {},
                            JSON.stringify([])]);
        server.respondWith(/2014-11-08-test-single.md/,
                           [200, {},
                            singleCommitResponse]);
        server.respondWith(/2014-11-08-test-multiple.md/,
                           [200, {},
                            multipleCommitsResponse]);
        server.respondWith(/asdf123/,
                           [200, {},
                            commitCommentsResponse]);
        server.respondWith(/asdf124/,
                           [200, {},
                            commitCommentsResponse]);
    });
    after(function () {
        server.restore();
    });
    afterEach(function () {
        var w = document.querySelector('div.talaria-wrapper');
        w.parentNode.removeChild(w);
    });
    it('should display an error when no commits can be found for a permalink', function () {
        document.querySelector('a.permalink').setAttribute('href','/2014/11/08/nonexistant');
        return talaria.init({GITHUB_USERNAME: 'm2w',
                             REPOSITORY_NAME: 'm2w.github.com'}).
            then(function () {
                var errorNode = document.querySelector('div.talaria-wrapper div.talaria-load-error');
                expect(errorNode.classList.contains('hide')).to.be.false;
                expect(errorNode.textContent).to.
                    equal('Unable to find commits for this post.');

                var commentNodes = document.querySelectorAll('div.talaria-wrapper div.talaria-comment-bubble');
                expect(commentNodes).
                    to.have.length(0);
            });
    });
    it('should render the comment for a single commit', function () {
        document.querySelector('a.permalink').setAttribute('href','/2014/11/08/test-single');
        return talaria.init({GITHUB_USERNAME: 'm2w',
                             REPOSITORY_NAME: 'm2w.github.com'}).
            then(function (comments) {
                var errorNode = document.querySelector('div.talaria-wrapper div.talaria-load-error');
                expect(errorNode.classList.contains('hide')).to.be.true;

                var commentNodes = document.querySelectorAll('div.talaria-wrapper div.talaria-comment-bubble');
                expect(commentNodes).to.have.length(1);
            });
    });
    it('should render all comments from multiple commits', function () {
        document.querySelector('a.permalink').setAttribute('href','/2014/11/08/test-multiple');
        return talaria.init({GITHUB_USERNAME: 'm2w',
                             REPOSITORY_NAME: 'm2w.github.com'}).
            then(function () {
                var errorNode = document.querySelector('div.talaria-wrapper div.talaria-load-error');
                expect(errorNode.classList.contains('hide')).to.be.true;

                var commentNodes = document.querySelectorAll('div.talaria-wrapper div.talaria-comment-bubble');
                expect(commentNodes).to.have.length(2);
            });
    });
    it('should display an error message when exceeding GitHub API rate-limit',
       function () {
           document.querySelector('a.permalink').setAttribute('href','/2014/11/08/ratelimited');
           return talaria.init({GITHUB_USERNAME: 'm2w',
                                REPOSITORY_NAME: 'm2w.github.com'}).
               then(function () {
                   var errorNode = document.querySelector('div.talaria-wrapper div.talaria-load-error');
                   expect(errorNode.classList.contains('hide')).to.be.false;
                   expect(errorNode.textContent).to.equal('The Github API rate-limit has been reached. Unable to load comments.');

                   var commentNodes = document.querySelectorAll('div.talaria-wrapper div.talaria-comment-bubble');
                   expect(commentNodes).to.have.length(0);
               });
       });
    it('should cache any API interaction results', function () {
        document.querySelector('a.permalink').setAttribute('href','/2014/11/08/test-multiple');

        var store = {};

        sinon.stub(sessionStorage, 'getItem', function (key) {
            return store[key];
        });
        sinon.stub(sessionStorage, 'setItem', function (key, value) {
            return store[key] = value + '';
        });
        sinon.stub(sessionStorage, 'removeItem', function (key) {
            delete store[key];
            return store;
        });

        return talaria.init({GITHUB_USERNAME: 'm2w',
                             REPOSITORY_NAME: 'm2w.github.com'}).
            then(function () {
                var stored = JSON.parse(store['/2014/11/08/test-multiple']);
                expect(stored).to.be.an('object');
                expect(stored.commentData.comments).to.have.length(2);
                sessionStorage.removeItem.restore();
                sessionStorage.getItem.restore();
                sessionStorage.setItem.restore();
            });
    });
});
