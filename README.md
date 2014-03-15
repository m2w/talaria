_talaria_ is a commenting system for static sites, like [github pages](http://pages.github.com/). It uses github commits to locate content and provide a way for others to comment. Check out talaria [in action](http://blog.tibidat.com).

## Installation

To install _talaria_ you have the choice between [bower](http://bower.io/):

```bower install m2w/talaria```

and a plain [download](https://github.com/m2w/talaria/releases/tag/0.2.2).

_talaria_ depends on [jQuery](http://jquery.com/).

Note: _talaria_ isn't yet listed on the bower repository.

## Getting started

_talaria_ makes some assumptions about how your DOM is structured. It assumes that:

- every commentable content source (for example a blog post) is wrapped in an `<article>`
- these `<article>` contain one distinct element (a permalink) that points to an URL that can be used to extrapolate the actual file name of the content.

What does that mean? Here is an example layout that would satisfy _talaria_'s needs.

```html
<body>
...
<article>
<a class="permalink" href="/2014/02/06/a-blog-post">A blog post!</a>
<p>My awesome unstyled one line blog post :D</p>
</article>
...
</body>
```

## Getting started for real

_talaria_ is composed of four components: 

- `talaria.js` which contains the logic to interact with the [github API](http://developer.github.com/v3/)
- `talaria.css` (or `talaria.scss` for [SASS](http://sass-lang.com/) users) which provide a basic github-esque styling for the comments
- `talaria-wrapper.html` and `talaria-comment.html`, template fragements for the comment section and individual comments respectively 

Assuming you have installed _talaria_ with bower and are using jekyll, you should copy `bower_components/talaria/src/talaria*.html` to your `_includes` directory. Next you need to customize _talaria_ so that it knows where to find your content sources (such as your blog posts).

### (optional) Customizing the look'n'feel

By default _talaria_ comments are skinned to almost mirror their counterparts on github. However, not all parts of _talaria_ are styled. Styling for elements such as `<a>` and `<code>` is (currently) not provided. Checkout `talaria.css` or `talaria.scss` and feel free to customize this to suit your tastes.

## Setting up

This step requires that you modify your site's (base) template. 

1. Add `{% include talaria-wrapper.html %}` inside your content's `<article>`
2. Add `{% include talaria-comment.html %} anywhere in your site's `<body>` - fear not, this is `display:none`
3. Add `<link href="/bower_components/talaria/dist/talaria.css" rel="stylesheet" type="text/css">` (or add an `@import` statement for the SASS in your main sass file)
4. Add `<script type="text/javascript" src="/bower_components/talaria/dist/talaria.js"></script>` (after jQuery!)
5. *After* including `talaria.js` call `talaria.init(CONFIG)` at some point, where `CONFIG` is an object that *must* contain appropriate values for `REPOSITORY_NAME` and `GITHUB_USERNAME`. For example:

```js
talaria.init({REPOSITORY_NAME: 'm2w.github.com', GITHUB_USERNAME: 'm2w'});
```

If required you have a couple of further customization options, include these as required in your `CONFIG` object:

- `COMMENTABLE_CONTENT_PATH_PREFIX` (default `_posts/`) relative prefix to your content source files
- `CONTENT_SUFFIX` (default `.md`) this is used by _talaria_ during the extrapolation of the path to individual content sources
- `PERMALINK_IDENTIFIER` (default `a.permalink`) this should be a valid jQuery selector that will be unique for each content source
- `PAGINATION_SCHEME` (default `/\/page\d+\//`) _talaria_ uses this to check whether it should expand comments by default or not

You're now done, test the setup to ensure everything is working fine and report any bugs :)

## FYI

The github API is currently restricted to *60 API calls per hour* for unauthenticated users. This means that your users can retrieve comments for at most 30 entries. This number is lower if you have multiple commits per 'content source file'; it costs 1 additional API request per additional commit (so if you have 3 commits for a the post `/2013/03/22/blog-relaunch`, _talaria_ actually needs a total of 4 API calls to get all comments). _talaria_ tries to use `sessionStorage` to reduce the total number of API calls, but users could potentially still run into `403` errors from throtteling, in which case _talaria_ displays a simple error message.

Users clicking the "Add comment" buttons get redirected to github, where they can then login and comment. However, at this point I do not know of a way to get users back to your site after the redirect.

## Trivia

talaria are the [winged sandals](http://en.wikipedia.org/wiki/Talaria) worn by Hermes in Greek mythology.
