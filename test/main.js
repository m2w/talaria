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
    commit2 = $.extend(true, {}, commit1),
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


// FIXME: the abuse of describe and before hooks is an abomination.
// I couldn't get assertions to work when called during the 'wait-loop'
describe('using gists', function () {
    before(function () {
        server = sinon.fakeServer.create();
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
        $('div.talaria-wrapper').remove();
        server.requests = [];
    });
    it('should display an error when unable to load the gist<=>post mappings',
       function () {
           talaria.test.init({USE_GISTS: true, GITHUB_USERNAME: 'm2w',
                              GIST_MAPPINGS: '/missing-mappings.json'});
           talaria.test.gists();
           server.respond();

           var errorNode = $('div.talaria-wrapper div.talaria-load-error');
           expect(errorNode.hasClass('hide')).to.be.false;
           expect(errorNode.text()).to.equal('Unable to load comments.');
           expect($('div.talaria-wrapper div.talaria-comment-bubble')).to.have.length(0);
       });
    describe('given a correct gist<=>post mapping', function () {
        before(function (done) {
            $('a.permalink').attr('href','/test/404');
            talaria.test.init({USE_GISTS: true, GITHUB_USERNAME: 'm2w',
                               GIST_MAPPINGS: '/mappings.json'});
            talaria.test.gists();
            server.respond();
            (function wait (i) {
                setTimeout(function () {
                       server.respond();
                    if (--i) {wait(i);}
                    else {done();}
                }, 200);
            })(2);
        });
        it('should display an error message when unable to locate a gist', function () {
            var errorNode = $('div.talaria-wrapper div.talaria-load-error');
            expect(errorNode.hasClass('hide')).to.be.false;
            expect(errorNode.text()).to.equal('Unable to find a matching gist.');
            expect($('div.talaria-wrapper div.talaria-comment-bubble')).to.have.length(0);
        });
    });
    describe('given too many requests', function () {
        before(function (done) {
            $('a.permalink').attr('href','/test/403');
            talaria.test.init({USE_GISTS: true, GITHUB_USERNAME: 'm2w',
                               GIST_MAPPINGS: '/mappings.json'});
            talaria.test.gists();
            server.respond();
            (function wait (i) {
                setTimeout(function () {
                       server.respond();
                    if (--i) {wait(i);}
                    else {done();}
                }, 200);
            })(2);
        });
        it('should display an error message when exceeding GitHub API rate-limit',
           function () {
            var errorNode = $('div.talaria-wrapper div.talaria-load-error');
            expect(errorNode.hasClass('hide')).to.be.false;
            expect(errorNode.text()).to.equal('The Github API rate-limit has been reached. Unable to load comments.');
            expect($('div.talaria-wrapper div.talaria-comment-bubble')).to.have.length(0);
           });
    });
    describe('should add the comments to the DOM', function () {
        before(function (done) {
            $('a.permalink').attr('href','/test/200');
            talaria.test.init({USE_GISTS: true, GITHUB_USERNAME: 'm2w',
                               GIST_MAPPINGS: '/mappings.json'});
            talaria.test.gists();
            server.respond();
            (function wait (i) {
                setTimeout(function () {
                       server.respond();
                    if (--i) {wait(i);}
                    else {done();}
                }, 200);
            })(2);
        });
        it('should retrieve and display all comments for a post', function () {
            expect($('div.talaria-wrapper div.talaria-load-error').
                   hasClass('hide')).to.be.true;
            expect($('div.talaria-wrapper div.talaria-comment-bubble')).
                to.have.length(1);
        });
        it('should cache any API interaction results', function () {
            // FIXME: no caching data being set atm, LOCAL_STORAGE_SUPPORTED returns false...
            var cache = sessionStorage.getItem('/test/200');
            expect(cache).to.be.ok;
        });
    });
});
describe('using commits', function () {
    before(function () {
        server = sinon.fakeServer.create();
        // grab commits
        // grab comments for each using sha
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
        // update DOM
    });
    after(function () {
        server.restore();
    });
    afterEach(function () {
        $('div.talaria-wrapper').remove();
    });
    describe('given a permalink for which no commits can be found', function () {
        before(function (done) {
             $('a.permalink').attr('href','/2014/11/08/nonexistant');
            talaria.test.init({GITHUB_USERNAME: 'm2w',
                               REPOSITORY_NAME: 'm2w.github.com'});
            talaria.test.commits();
            server.respond();
            (function wait (i) {
                setTimeout(function () {
                       server.respond();
                    if (--i) {wait(i);}
                    else {done();}
                }, 200);
            })(3);
        });
        it('should display an error', function () {
            var errorNode = $('div.talaria-wrapper div.talaria-load-error');
            expect(errorNode.hasClass('hide')).to.be.false;
            expect(errorNode.text()).to.
                equal('Unable to find commits for this post.');
            expect($('div.talaria-wrapper div.talaria-comment-bubble')).
                to.have.length(0);
        });
    });
    describe('given a post with a single commit and comment', function () {
        before(function (done) {
            $('a.permalink').attr('href','/2014/11/08/test-single');
            talaria.test.init({GITHUB_USERNAME: 'm2w',
                               REPOSITORY_NAME: 'm2w.github.com'});
            talaria.test.commits();
            server.respond();
            (function wait (i) {
                setTimeout(function () {
                       server.respond();
                    if (--i) {wait(i);}
                    else {done();}
                }, 200);
            })(3);
        });
        it('should render the comment', function () {
            var errorNode = $('div.talaria-wrapper div.talaria-load-error');
            expect(errorNode.hasClass('hide')).to.be.true;
            expect($('div.talaria-wrapper div.talaria-comment-bubble')).
                to.have.length(1);
        });
    });
    describe('given a post with a two commits with a comment each', function () {
        before(function (done) {
            $('a.permalink').attr('href','/2014/11/08/test-multiple');
            talaria.test.init({GITHUB_USERNAME: 'm2w',
                               REPOSITORY_NAME: 'm2w.github.com'});
            talaria.test.commits();
            server.respond();
            (function wait (i) {
                setTimeout(function () {
                       server.respond();
                    if (--i) {wait(i);}
                    else {done();}
                }, 200);
            })(3);
        });
        it('should render all comments', function () {
            var errorNode = $('div.talaria-wrapper div.talaria-load-error');
            expect(errorNode.hasClass('hide')).to.be.true;
            expect($('div.talaria-wrapper div.talaria-comment-bubble')).
                to.have.length(2);
        });
    });
    describe('given too many requests to the Github API', function () {
        before(function (done) {
            $('a.permalink').attr('href','/2014/11/08/ratelimited');
            talaria.test.init({GITHUB_USERNAME: 'm2w',
                               REPOSITORY_NAME: 'm2w.github.com'});
            talaria.test.commits();
            server.respond();
            (function wait (i) {
                setTimeout(function () {
                       server.respond();
                    if (--i) {wait(i);}
                    else {done();}
                }, 200);
            })(3);
        });
        it('should display an error message when exceeding GitHub API rate-limit',
           function () {
               var errorNode = $('div.talaria-wrapper div.talaria-load-error');
               expect(errorNode.hasClass('hide')).to.be.false;
               expect(errorNode.text()).to.equal('The Github API rate-limit has been reached. Unable to load comments.');
               expect($('div.talaria-wrapper div.talaria-comment-bubble')).to.have.length(0);
       });
    });
    it('should cache any API interaction results');
});
