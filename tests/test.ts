import test from 'ava';
import { Talaria, IConfiguration, Backend, ConfigError } from '../lib/talaria';

test('instantiation requires a backend', (t) => {
  const x = () => {
    new Talaria({
      backend: undefined,
      mappingUrl: undefined
    });
  };
  t.throws(x, ConfigError);
});

test('backend.Issues requires a github username and repository', (t) => {
  const x = () => {
    new Talaria({
      backend: Backend.Issues,
      mappingUrl: 'some-url'
    });
  };
  t.throws(x, ConfigError);
});

test('backend.Gists requires a github username', (t) => {
  const x = () => {
    new Talaria({
      backend: Backend.Gists,
      mappingUrl: 'some-url'
    });
  };
  t.throws(x, ConfigError);
});

test('Talaria.format works as intended', (t) => {
  const currentYear = new Date();
  currentYear.setMonth(0);
  currentYear.setDate(31);
  const talaria = new Talaria({
    backend: Backend.Gists,
    mappingUrl: '/my-mappings.json',
    github_username: 'a-user'
  });

  const pastYear = new Date();
  pastYear.setMonth(11);
  pastYear.setDate(31);
  pastYear.setFullYear(2016);

  t.is(talaria['formatDate'](currentYear), 'on Jan 31');
  t.is(talaria['formatDate'](pastYear), 'on Dec 31, 2016');
});

test.todo('test mappings related logic');
