import * as chai from 'chai';
import * as sinon from 'sinon';
import { inspect } from 'util';

import { Talaria, IConfiguration, Backend, ConfigError } from '../lib/talaria';
import * as fixtures from './fixtures';

const should = chai.should();

describe('configuration', () => {
  it('requires a backend', () => {
    const x = () => {
      new Talaria({
        backend: undefined,
        mappingUrl: undefined
      });
    };
    should.Throw(x, 'Invalid configuration');
  });

  it('requires a github username and repository with backend.Issues', () => {
    const x = () => {
      new Talaria({
        backend: Backend.Issues,
        mappingUrl: 'some-url'
      });
    };
    should.Throw(x, 'When using Issue');

    const y = () => {
      new Talaria({
        backend: Backend.Issues,
        mappingUrl: 'some-url',
        github_repository: 'some-repo',
        github_username: 'some-user'
      });
    };
    should.not.Throw(y);
  });

  it('requires a github username with backend.Gists', () => {
    const x = () => {
      new Talaria({
        backend: Backend.Gists,
        mappingUrl: 'some-url'
      });
    };
    should.Throw(x, 'When using Gist');

    const y = () => {
      new Talaria({
        backend: Backend.Issues,
        mappingUrl: 'some-url',
        github_username: 'some-user'
      });
    };
    should.not.Throw(y, ConfigError);
  });
});

describe('utils', () => {
  it('formats dates as inteded', () => {
    const t = new Talaria(fixtures.bareTalariaConfig);

    const currentYear = new Date();
    currentYear.setMonth(0);
    currentYear.setDate(31);

    const pastYear = new Date();
    pastYear.setMonth(11);
    pastYear.setDate(31);
    pastYear.setFullYear(2016);

    t['formatDate'](currentYear).should.equal('on Jan 31');
    t['formatDate'](pastYear).should.equal('on Dec 31, 2016');
  });
});

describe('Talaria.run', () => {
  const sandbox = sinon.sandbox.create();
  const permalinks = [
    fixtures.urls.permalink,
    fixtures.urls.permalinkInvalidMapping,
    fixtures.urls.permalinkNoMapping
  ];
  let setStub;
  let getStub;

  beforeEach('setup sandbox', () => {
    getStub = sandbox.stub(sessionStorage, 'getItem').callsFake((key) => {
      switch (key) {
        case fixtures.urls.contentExpiredCache:
          const d = new Date();
          d.setHours(d.getHours() - 2);
          return JSON.stringify({
            ts: d,
            value: fixtures.comments
          });
        case fixtures.urls.contentCached:
          return JSON.stringify({
            ts: new Date().getTime(),
            value: fixtures.comments
          });
        default:
          return null;
      }
    });
    setStub = sandbox.stub(sessionStorage, 'setItem');

    // setup stub github API and mappings file
    sandbox.useFakeServer();

    sandbox.server.respondImmediately = true;

    sandbox.server.respondWith(/test-id\/comments/, (req) => {
      req.respond(200, {}, JSON.stringify(fixtures.comments))
    });

    sandbox.server.respondWith(fixtures.urls.mappingsMissing, [404, {}, '']);
    sandbox.server.respondWith(fixtures.urls.mappings, fixtures.jsonResp(fixtures.mappings));

    sandbox.server.respondWith(fixtures.urls.content, fixtures.jsonResp(fixtures.comments));
    sandbox.server.respondWith(fixtures.urls.contentCached, fixtures.jsonResp(fixtures.comments));
    sandbox.server.respondWith(fixtures.urls.contentMissing, [404, {}, '']);
    sandbox.server.respondWith(fixtures.urls.contentExpiredCache, fixtures.jsonResp(fixtures.comments));
  });

  beforeEach('add test DOM contents', () => {
    for (let href of permalinks) {
      document.body.insertAdjacentHTML(
        'afterbegin',
        fixtures.testContent(href)
      );
    }
  });

  afterEach('restore sandbox', () => {
    sandbox.restore();
  });

  afterEach('cleanup DOM', () => {
    for (let href of permalinks) {
      document.body.removeChild(
        document.getElementById(href)
      );
    }
  });

  // --- mappings
  it('exits when mappings cannot be loaded', () => {
    const conf = Object.assign(
      {},
      fixtures.bareTalariaConfig,
      { mappingUrl: fixtures.urls.mappingsMissing }
    );
    const t = new Talaria(conf);
    const p = t.run();

    return p.then(() => {
      throw new Error('');
    }).catch((error) => {
      error.should.be.a('Error');
    });
  });

  it.skip('validates mappings', () => {
    // TODO: implement
  });

  // --- caching
  it('caches mappings', () => {
    const t = new Talaria(fixtures.bareTalariaConfig);
    const p = t['fetch'](fixtures.urls.mappings, '*');

    return p.then((res) => {
      res.should.deep.eq(fixtures.mappings);
      setStub.called.should.be.true;
    });
  });

  it('uses cached comments when available', () => {
    const t = new Talaria(fixtures.bareTalariaConfig);
    return t['fetch'](fixtures.urls.contentCached, '*').then((res) => {
      res.should.deep.eq(fixtures.comments);
      getStub.called.should.be.true;
    });
  });

  it('fetches comments when cached data is expired', () => {
    const t = new Talaria(fixtures.bareTalariaConfig);
    const p = t['fetch'](fixtures.urls.contentExpiredCache, '*');

    return p.then((res) => {
      getStub.called.should.be.true;
      setStub.called.should.be.true;
      res.should.deep.eq(fixtures.comments);
      should.equal(setStub.called, true);
    });
  });

  it('retrieves comments for all permalinks with mappings', () => {
    const t = new Talaria(fixtures.bareTalariaConfig);
    const p = t.run();

    return p.then(() => {
      // mapping + 2 API requests
      sandbox.server.requests.length.should.be.equal(3);

      // only 1 content object should have comments
      document.querySelectorAll('.talaria').length.should.be.equal(1);
      // there should be 4 comments
      document.querySelectorAll('.talaria-comment-wrapper').length.should.be.equal(4);
    });
  });
});
