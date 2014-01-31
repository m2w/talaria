_talaria_ is a commenting system for static sites, notably github pages. It uses github commits to locate content and provide a way for others to comment. Check out talaria [in action](http://blog.tibidat.com).

## Requirements

_talaria_ requires jQuery and uses `<article>` elements to seperate content. Each of your individual content sources (e.g. blog post) should be wrapper in an `<article>` and contain a `a.permalink` (this can be customized) that links to a URL from which talaria can extrapolate the path of the content source (for a blog post this might be a markdown file).

## First step

_talaria_ comes with four essential components: `talaria.js`, `talaria.css` (or `talaria.scss` for sass users), `talaria-wrapper.html` and `talaria-comment.html`. Copy all four over to your static site.


## Tell talaria how to locate your content

Edit `talaria.js` so that it uses your _publicly available_ repository. For this, update `REPOSITORY_NAME` and `GITHUB_USERNAME` accordingly. If required you can also modify `COMMENTABLE_CONTENT_PATH_PREFIX`, `CONTENT_SUFFIX` and `PERMALINK_IDENTIFIER`.

## Customize the look'n'feel

By default _talaria_ comments are skinned to almost mirror their counterparts on github. However, not all parts of talaria are styled. Styling for things such as `<a>` and `<code>` are (currently) not provided. Feel free to customize this to suit your tastes.

## Add talaria to your site

This step requires that you modify your site (base) template. 

1. Add the *contents* of `talaria-wrapper.html` whereever you want the comments to appear.
2. Add the *contents* of `talaria-comment.html` anywhere in the `<body>` of your site.
3. Add `<link href="/path/to/talaria.css" rel="stylesheet" type="text/css">` (or add `@import talaria.scss;` in your main sass file) to your site's `<head>`
4. Add `<script type="text/javascript" src="/path/to/talaria.js"></script>` to your site's `<head>`


## FYI

The github API is currently restricted to *60 API calls per hour* for unauthenticated users. This means that your users can retrieve comments for at most 30 entries. This number is lowered if you have multiple commits per 'content source file'; by 1 additional API request per additional commit (so if you have 3 commits for a the post `/2013/03/22/blog-relaunch`, talaria actually needs a total of 4 API calls to get all comments). talaria tries to use `sessionStorage` to reduce the total number of API calls, but users could potentially still run into `403` errors from throtteling, in which case talaria displays a simple error message.

Users clicking the "Add comment" buttons get redirected to github, where they can then login and comment. However, at this point I do not know of a way to get users back to your site after the redirect.

## Trivia

talaria are the [winged sandals](http://en.wikipedia.org/wiki/Talaria) worn by Hermes in Greek mythology.
