import { Talaria, IConfiguration, Backend, ConfigError } from '../lib/talaria';

export const comment = (id: number) => {
  return {
    id: `${id}`,
    body: 'a comment',
    body_html: '<p>a comment</p>',
    updated_at: new Date().toISOString(),
    user: {
      html_url: 'http://example.com',
      login: 'a user',
      avatar_url: ''
    }
  };
};

export const urls = {
  mappingsMissing: '/test-missing-mappings.json',
  mappings: '/test-mappings.json',
  content: '/github-api/url/',
  contentCached: '/github-api/url/cached',
  contentExpiredCache: '/github-api/url/expired-cache/',
  contentMissing: '/github-api/url/missing',
  permalink: '/test-permalink',
  permalinkNoMapping: '/test-permalink/no-mapping',
  permalinkInvalidMapping: '/test-permalink/wrong-mapping'
};

export const mappings = {};
mappings[urls.permalink] = {
  id: 'test-id'
};
mappings[urls.permalinkInvalidMapping] = {
  id: 'test-id-missing'
};

export const jsonResp = (body) => {
  return [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify(body)
  ];
}

export const comments = [
  comment(1),
  comment(2),
  comment(3),
  comment(4)
];

export const bareTalariaConfig = {
  backend: Backend.Gists,
  mappingUrl: urls.mappings,
  github_username: 'a-user',
  cacheTimeout: 60 * 60 * 1000
};

export const testContentId = 'test-content';

export const testContent = (href) => {
  return `<article id="${href}">
<a class="permalink" href="${href}">Testing!</a>
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
  irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
  cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
</article>`;
}
