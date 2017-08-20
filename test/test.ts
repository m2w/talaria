import * as chai from 'chai';
import { Talaria, IConfiguration, Backend, ConfigError } from '../lib/talaria';

const should = chai.should();

const bareTalariaConfig = {
  backend: Backend.Gists,
  mappingUrl: '/my-mappings.json',
  github_username: 'a-user'
};

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
  // TODO: setup fake server
  // TODO: stub sessionStorage
  it.skip('exits when mappings cannot be loaded', () => {

  });

  it.skip('uses cached comments when available', () => {

  });

  it.skip('only uses cached comments when not expired', () => {

  });

  it.skip('does not retrieve comments for permalinks without mapping', () => {

  });
});
