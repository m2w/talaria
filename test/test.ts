import * as chai from 'chai';
import * as sinon from 'sinon';
import { inspect } from 'util';

import { Talaria, IConfiguration, Backend, ConfigError } from '../lib/talaria';
import { bareTalariaConfig, cachedComments, comment, comments, testContent, testContentId } from './fixtures';

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
    const t = new Talaria(bareTalariaConfig);

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
  let setStub;
  let getStub;

  before('stub sessionStorage', () => {
    getStub = sandbox.stub(sessionStorage, 'getItem').callsFake((key) => {
      switch (key) {
        case '/timed-out-comments':
          const d = new Date();
          d.setHours(d.getHours() - 2);
          return JSON.stringify({
            ts: d,
            value: comments
          });
        case '/exists':
          return JSON.stringify(cachedComments);
        default:
          return null;
      }
    });
    sandbox.useFakeServer();

    sandbox.server.respondWith(
      '/missing-mappings.json',
      [404, {}, '']
    );

    sandbox.server.respondWith(
      '/exists',
      [200, { 'Content-Type': 'application/json' }, JSON.stringify(comments)]
    );

    sandbox.server.respondWith(
      '/timed-out-comments',
      [200, { 'Content-Type': 'application/json' }, JSON.stringify(comments)]
    );

    setStub = sandbox.stub(sessionStorage, 'setItem');
  });

  after('restore sandbox', () => {
    document.body.removeChild(
      document.getElementById(testContentId)
    );
    sandbox.restore();
  });

  it('exits when mappings cannot be loaded', () => {
    document.body.insertAdjacentHTML(
      'afterbegin',
      testContent('/test/123')
    );

    const conf = Object.assign(
      bareTalariaConfig,
      { mappingUrl: '/missing-mappings.json' }
    );
    const t = new Talaria(conf);
    const p = t.run();

    sandbox.server.respond();

    return p.then(() => {
      throw new Error('');
    }).catch((error) => {
      error.should.be.a('Error');
    });
  });

  it('uses cached comments when available', () => {
    const t = new Talaria(bareTalariaConfig);
    return t['fetch']('/exists', '*').then((res) => {
      res.should.deep.eq(comments);
      getStub.called.should.be.true;
    });
  });

  it('only uses cached comments when not expired', () => {
    const t = new Talaria(bareTalariaConfig);
    const p = t['fetch']('/timed-out-comments', '*');

    sandbox.server.respond();

    return p.then((res) => {
      getStub.called.should.be.true;
      setStub.called.should.be.true;
      res.should.deep.eq(comments);
      should.equal(setStub.called, true);
    });
  });

  it.skip('does not retrieve comments for permalinks without mapping', () => {
    document.body.insertAdjacentHTML(
      'afterbegin',
      testContent('/test/123')
    );
  });
});
