# talaria

talaria is a simple commenting system for static sites. It uses Github Issues or Gists as backend.

## Status

talaria is currently undergoing a full rewrite, it's about 60% done. It's missing a test suite and a couple of improvements/fixes:

- [ ] option to toggle comment visibility
- [ ] custom selector for where the comments are mounted inside the content
- [ ] test suite with at least 80% coverage

**Compatability**: talaria targets ES2015, as such IE is **not** supported!

## Getting started

### Installation

Once the rewrite becomes stable, I will create a new github release. If you are feeling adventourus, feel free to clone the repo and explore (it's only ~200LOC).

I will eventually get around to releasing talaria on `npm` but until that time, github releases will have to suffice.

### Requirements

For talaria to function, your content has to comply with certain structural requirements. talaria requires any content that you want to have comments for (such as a blog post), to have an `<a>` tag with a `href` that uniquely identifies said content (a permalink). All permalinks on a page should be queriable from a single `document.querySelectorAll`, hence must have a shared `class` attribute (e.g. `permalink`).

Additionally, talaria is currently hardcoded to attach the comments as the *last* child element of the `parentElement` of your permalink, so overall your content should be structured as similar to this:

```html
<body>
...
<article>
<a class="permalink" href="a-permalink">Title</a>
<p>...</p>
<!-- comments will be added here  -->
</article>
</body>
```

### Initializing talaria

Start by including `<script src="dist/talaria.js"></script>` somewhere on you page (preferably towards then end of `<body>`).
You now have access to the global `talaria` variable. To initialize talaria, add a second `<script>` below the first one:

```html
<script src="<path-to-talaria>/dist/talaria.js"></script>
<script>
  var t = new talaria.Talaria({
      backend: talaria.Backend.Gists,
      mappingUrl: 'mappings.json',
      github_username: 'm2w',
      github_repository: 'talaria',
      ignoreErrors: true
    });
    t.run();
</script>
```

### Configuring talaria

Most of talaria's functionality can be customized through the configuration object passed to the `Talaria` constructor. Available configuration options are:

- `backend` [`Backend`] *required*, the backend determines where you intend to host comments for your content: as comments on github issues or as comments on gists. The options are respectively `Backend.Issues` and `Backend.Gists`.
- `mappingUrl` [`string`] *required*, a URL pointing to a JSON object containing a mapping of `content-permalink -> github_id`. The `content-permalink` is used by talaria to associate content with its comments and the `github_id` is either the id of a gist or of an issue.
- `github_username` [`string`] *required*, is your username on github. It is used to construct the URLs back to your gists/issues and to build the github API URLs when using issue-based comments.
- `github_repository` [`string`], is required when using issue-based comments, as it is necessary to build URLs for the github API.
- `ignoreErrors` [`boolean`], is a flag that tells talaria to either display a short error message below content when errors occur (e.g. Rate-Limits on the github API or invalid `github_id`s) or simply ignore them.
- `permalinkSelector` [`string` (default: `.permalink`)], should be a valid CSSSelector that talaria can use to find `content-permalink`s.
- `insertionSelector` [`string`], an optional CSS selector that determines where comments are inserted into the DOM. The selector is run off `<permalink-element>.parentElement`, and inserted `beforeend` (as the last child of the target node).
- `cacheTimeout` [`number` (default: `3600000`)], the time (in ms) before cached date expires (and talaria will refetch comment data).
- `commentsVisible` [`boolean` (default: `false`)], a flag that determines whether comments are initially expanded. When `false`, users will only see a `N comments` notice, which they can click to view all corresponding comments.

### Customizing talaria's look'n'feel

talaria ships with very simple styles that mostly mirror github's own styles. These styles are available under `dist/talaria{.css|.min.css}`.

All styles are encapsulated using a `talaria-` prefix and should therefore not "leak". If you wish to customize the styles, please look into both `lib/talaria.css` and `lib/talaria.ts` as to what selectors you should provide stylings for.

## Gotchas

* The Github v3 API is restricted to *60 API calls per hour* for unauthenticated users. This means we can retrieve comments for at most 60 posts! talaria tries to use `sessionStorage` to reduce the total number of API calls, but users can/will still run into `403` errors from throtteling depending on your site's setup.

## Development

I would love feedback on the code, bug reports, feature requests or even pull requests!

The goal for talaria is to have a small, clean and well documented code base. You can help make that a reality :)

To get started hacking on talaria:

1. Clone this repo.
2. Run `yarn install` inside the repo (yarn is an alternative to npm)
3. See `yarn run` for a list of commands - all of talaria's build steps are `package.json` `scripts`

## Trivia

talaria are the [winged sandals](http://en.wikipedia.org/wiki/Talaria) worn by Hermes in Greek mythology.
