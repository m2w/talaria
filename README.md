_talaria_ is a commenting system for static sites, notably github pages. It uses github commits to locate content and provide a way for others to comment. Check out talaria [in action](http://blog.tibidat.com).

## Requirements

_talaria_ requires jQuery and your static site needs to be available as a public github repository.

To be identify individual content sources (such as a blog post), _talaria_ is based around the assumption that each content source is wrapped in an `<article>` element and contains a distinct element that contains to a URI that can be used to derive the path to the file containing the content.

```html
<body>
...
<article>
<a class="permalink" href="/url/schema/that/can/be/resolved/to/a/file/path">A blog post!</a>
...
</article>
...
</body>
```

## First step

_talaria_ is composed of four components: 

- `talaria.js` which contains the logic to interact with the github API
- `talaria.css` (or `talaria.scss` for sass users) which provide a basic github-esque styling for the comments
- `talaria-wrapper.html` and `talaria-comment.html`, template fragements for the comment section and individual comments respectively 

To get started copy all four to the assets or static directory of your static site.

```bash
$ cp talaria* /my/blog/repository/
```

Next we need to customize _talaria_ so that it can locate your content correctly.

## Customize _talaria_'s behaviour 

Edit `talaria.js` so that it points to your static site's _publicly available_ github repository - Update `REPOSITORY_NAME` and `GITHUB_USERNAME` accordingly. 

If required you have a couple of other customization options:

- `COMMENTABLE_CONTENT_PATH_PREFIX` (default `_posts/`) relative prefix to your content source files
- `CONTENT_SUFFIX` (default `.md`) this is used by _talaria_ during the extrapolation of the path to individual content sources
- `PERMALINK_IDENTIFIER` (default `a.permalink`) this should be a valid jQuery selector that will be unique for each content source
- `PAGINATION_SCHEME` (default `/\/page\d+\//`) _talaria_ uses this to check whether it should expand comments by default or not
- `extrapolatePathFromPermalink(permalink_url)` handles the actual translation from URL to filename.

In its current state _talaria_ is still far from fully configurable.

## (optional) Customize the look'n'feel

By default _talaria_ comments are skinned to almost mirror their counterparts on github. However, not all parts of _talaria_ are styled. Styling for things such as `<a>` and `<code>` is (currently) not provided. Feel free to customize this to suit your tastes.

## Add talaria to your site

This step requires that you modify your site's (base) template. 

1. Add the *contents* of `talaria-wrapper.html` whereever you want the comments to appear.
2. Add the *contents* of `talaria-comment.html` anywhere in the `<body>` of your site.
3. Add `<link href="/path/to/talaria.css" rel="stylesheet" type="text/css">` (or add `@import talaria.scss;` in your main sass file) to your site's `<head>`
4. Add `<script type="text/javascript" src="/path/to/talaria.js"></script>` to your site's `<head>`

For steps 1 and 2 I recommend using something like the jekyll `{% include %}` statement.

## FYI

The github API is currently restricted to *60 API calls per hour* for unauthenticated users. This means that your users can retrieve comments for at most 30 entries. This number is lower if you have multiple commits per 'content source file'; it costs 1 additional API request per additional commit (so if you have 3 commits for a the post `/2013/03/22/blog-relaunch`, talaria actually needs a total of 4 API calls to get all comments). talaria tries to use `sessionStorage` to reduce the total number of API calls, but users could potentially still run into `403` errors from throtteling, in which case talaria displays a simple error message.

Users clicking the "Add comment" buttons get redirected to github, where they can then login and comment. However, at this point I do not know of a way to get users back to your site after the redirect.

## Trivia

talaria are the [winged sandals](http://en.wikipedia.org/wiki/Talaria) worn by Hermes in Greek mythology.
