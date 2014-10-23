var expect = chai.expect;

describe('talaria', function () {
    beforeEach(function () {
        server = sinon.fakeServer.create();
    });
    afterEach(function () {
        // remove any talaria generated html
        $('div.talaria-wrapper').remove();
        server.restore();
    });
    describe('using gists', function () {
        before(function () {
            talaria.test.init({USE_GISTS: true, GITHUB_USERNAME: 'm2w',
                               GIST_MAPPINGS: '/mappings.json'});
        });
        after(function () {
            server.restore();
        });
        it('should retrieve and display all comments for a post',
           function () {
               server.respondWith('/mappings.json',
                                  [200, {"Content-Type": "application/json"},
                                   JSON.stringify(
                                       {"test.md":
                                        {"permalink": "/this/is/a/test",
                                         "id": "dummy1"}}
                                   )]
               );
               server.respondWith(
                   /https:\/\/api.github.com\/gists\/dummy1\/comments/,
                   function (req) {
                       req.respond(404, {},
                                   JSON.stringify(
                                       [
                                           {
                                               "id": 1,
                                               "url":
                                               "https://api.github.com/gists/ab21536bde9abe8dc3e8/comments/1",
                                               "body": "Just commenting for the sake of commenting",
                                               "user": {
                                                   "login": "octocat",
                                                   "id": 1,
                                                   "avatar_url":
                                                   "https://github.com/images/error/octocat_happy.gif",
                                                   "gravatar_id": "",
                                                   "url":
                                                   "https://api.github.com/users/octocat",
                                                   "html_url":
                                                   "https://github.com/octocat",
                                                   "followers_url":
                                                   "https://api.github.com/users/octocat/followers",
                                                   "following_url":
                                                   "https://api.github.com/users/octocat/following{/other_user}",
                                                   "gists_url":
                                                   "https://api.github.com/users/octocat/gists{/gist_id}",
                                                   "starred_url":
                                                   "https://api.github.com/users/octocat/starred{/owner}{/repo}",
                                                   "subscriptions_url":
                                                   "https://api.github.com/users/octocat/subscriptions",
                                                   "organizations_url":
                                                   "https://api.github.com/users/octocat/orgs",
                                                   "repos_url":
                                                   "https://api.github.com/users/octocat/repos",
                                                   "events_url":
                                                   "https://api.github.com/users/octocat/events{/privacy}",
                                                   "received_events_url":
                                                   "https://api.github.com/users/octocat/received_events",
                                                   "type": "User",
                                                   "site_admin": false
                                               },
                                               "created_at":
                                               "2011-04-18T23:23:56Z",
                                               "updated_at":
                                               "2011-04-18T23:23:56Z"
                                           }
                                       ]
                                   ));
                   }
               );

               talaria.test.gists();
               server.respond();

               expect($('div.talaria-wrapper div.talaria-load-error').hasClass('hide')).to.be.true;
               expect($('div.talaria-wrapper div.talaria-comment-bubble')).to.have.length(1)
               expect($('#1')).to.have.length(1);
           });
        it('should display an error message when unable to locate a gist',
           function () {
               server.respondWith('/mappings.json',
                                  [200, {"Content-Type": "application/json"},
                                   JSON.stringify(
                                       {"test.md":
                                        {"permalink": "/this/is/a/test",
                                         "id": "asdf"}}
                                   )]
               );
               server.respondWith(
                   /https:\/\/api.github.com\/gists\/idonotexist\/comments/,
                   function (req) {
                       req.respond(404, {},
                                   JSON.stringify(
                                       {
                                           "message": "Not Found",
                                           "documentation_url": "https://developer.github.com/v3"
                                       }
                                   ));
                   }
               );

               talaria.test.gists();
               server.respond();

               var err = $('div.talaria-wrapper div.talaria-load-error');
               expect(err.hasClass('hide')).to.be.false;
               expect(err.text()).to.equal('Unable to find a matching gist.');
               expect(
                   $('div.talaria-wrapper div.talaria-comment-count').
                       hasClass('hide')
               ).to.be.true;
           });
        it('should display an error when unable to load the gist<=>post mappings',
           function () {
               server.respondWith('/mappings.json',
                                  [404, {"Content-Type": "text/html"},
                                   "File not found"]
               );
               talaria.test.gists();
               server.respond();

               var err = $('div.talaria-wrapper div.talaria-load-error');
               expect(err.hasClass('hide')).to.be.false;
               expect(err.text()).to.equal('Unable to load comments.');
               expect(
                   $('div.talaria-wrapper div.talaria-comment-count').
                       hasClass('hide')
               ).to.be.true;
           });
        it('should display an error message when exceeding GitHub API rate-limit',
           function () {
               server.respondWith(
                   // FIXME: currently this never fires, not sure why...
                   /gists\/asdf\/comments/gi,
                   [403, {"X-RateLimit-Remaining": 0},
                    JSON.stringify(
                        {"message": "API rate limit exceeded for 127.0.0.1. (But here's the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.)",
                         "documentation_url": "https://developer.github.com/v3/#rate-limiting"
                        })]
               );
               server.respondWith('/mappings.json',
                                  [200, {"Content-Type": "application/json"},
                                   JSON.stringify(
                                       {"test.md":
                                        {"permalink": "/this/is/a/test",
                                         "id": "asdf"}}
                                   )]
               );
               talaria.test.gists();
               server.respond();

               var err = $('div.talaria-wrapper div.talaria-load-error');
               expect(err.hasClass('hide')).to.be.false;
               expect(err.text()).to.equal(
                   'The github API rate-limit has been reached. ' +
                       'Unable to load comments.'
               );
               expect(
                   $('div.talaria-wrapper div.talaria-comment-count').
                       hasClass('hide')
               ).to.be.true;
           });
        it('should cache any API interaction results');
    });
    describe('using commits', function () {
        it('should retrieve all comments for a post');
        it('should display an error message when exceeding GitHub API rate-limit');
        it('should cache any API interaction results');
    });
});
