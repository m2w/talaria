= talaria

talaria is a commenting system for static sites, using Github as
backend. It currently supports gist- and commit-based commenting.

You can see talaria in action http://blog.tibidat.com[here].

:toc:

== Overview

talaria identifies content that potentially has comments through a
distinct permalink. It then uses that information to interact with the
Github API and retrieve any comments.

Users can see all comments for each item directly on your site and
will get redirected to Github when they click the "Add a comment"
button.

To this end, the following assumptions are made:

. commentable content is wrapped in `<article>` tags.
. each `<article>` contains a distinct permalink that can be used by
talaria to extrapolate the file name or gist id.

Here's a quick example:

----
<body>
...
<article>
<a class="permalink" href="/2014/02/06/a-blog-post">A blog post!</a>
<p>My awesome unstyled one line blog post :D</p>
</article>
...
</body>
----

== Installation

You can install talaria through http://bower.io[bower]:

    bower install m2w/talaria


Or grab the latest release from
https://github.com/m2w/talaria/releases/latest/[Github].

If you manually grab the release (or clone the repo) make sure you run

   bower install

== Getting started

Let's see how talaria can be used to add comments to your static
site.

For the following, I assume that you installed talaria through
bower and are adding it to a Jekyll-powered site.

== Initializing talaria

Add `<script>` tags for jQuery, async.js and talaria. You can also add
a `<link>` to `talaria.css` or `@include`
`talaria.sass`. `talaria.{css|sass}` provides default styling that
mirrors the Github styling.

To initialize talaria call `talaria.init(CONFIG)`. Bare minimum
example:

----
talaria.init({REPOSITORY_NAME: 'm2w.github.com', GITHUB_USERNAME: 'm2w'});
----

== Configuring talaria

talaria is designed to be customizable. Here is the full list of
currently supported `CONFIG` properties:

=== Global settings

`PERMALINK_IDENTIFIER`::
(default `a.permalink`) valid jQuery selector that can be used to
identify each content source
`PAGINATION_SCHEME`::
(default `/\/page\d+\//`) used to automatically expand comments when
viewing non-paginated content
`CACHE_TIMEOUT`::
(default 1hr) determines whether local data is stale or not.
`USE_GISTS`::
(default `false`) simple flag to switch between the gist and commit
backend

=== Commit-backend specific settings

`COMMENTABLE_CONTENT_PATH_PREFIX`::
(default `_posts/`) relative path-prefix to your content source files
`CONTENT_SUFFIX`::
(default `.md`) added during path extrapolation
`PERMALINK_STYLE`::
(default `/[\.\w\-_:\/]+\/(\d+)\/(\d+)\/(\d+)\/([\w\-\.]+)$/`, which
matches something along the lines of
`/:categories/:year/:month/:day/:slug`, note the missing extension at
the end) controls how talaria resolves filenames from
permalinks, you can choose between `pretty`, `date`, `none` or a
custom regex. These correspond to the Jekyll defaults, if you choose
to provide your own regex and you are using commit-based comments
please have a look at `extrapolatePathFromPermalink` to ensure that it
will work as you expect it to.

=== Gist-backend specific settings

`GIST_MAPPINGS`::
URL that points to a JSON file that provides a mapping between
permalinks and Gist IDs. It must follow the following structure:
----
{:FILENAME: {"id": :GIST_ID, "permalink": :permalink},
 :FILENAME2: {"id": :GIST_ID, "permalink": :permalink}}
----
Expect this format to change. Take a look at this
https://github.com/m2w/m2w.github.com/blob/master/Rakefile#L152[Rakefile]
to see how you could go about generating such a mapping.

== Customizing talaria's look'n'feel

If you are using the provided `talaria.{css|sass}` the comments will
mostly mirror their counterparts on Github. It is, however, not a
complete set of styling directives, so your mileage may vary.

== Gotchas

* When using the commit backend, avoid committing your commentable
  content along with other files.
  e.g. if you regenerate your tag subpages after creating a
  new blog post, these should be two separate commits.
* Never have multiple commentable content files in the same
  changeset.
  e.g. if you update 3 blog posts at once (say you change the
  spelling for a tag), commit each change file seperately. This ensures
  there is no comment overlap between posts. It also guarantees that the
  user will only see the post he planned to comment on while on Github.
* Avoid committing non-commentable content along with commentable
  content.
* The Github API is currently restricted to *60 API calls per hour* for
  unauthenticated users. This means that your users can retrieve
  comments for at most 30 entries. This number is lower if you have
  multiple commits per 'content source file'; it costs 1 additional API
  request per additional commit (so if you have 3 commits for a the post
  `/2013/03/22/blog-relaunch`, _talaria_ actually needs a total of 4 API
  calls to get all comments). _talaria_ tries to use `sessionStorage` to
  reduce the total number of API calls, but users could potentially
  still run into `403` errors from throtteling, in which case _talaria_
  displays a simple error message.
* talaria appends the comments to each `<article>`. This is currently
  not customizable.

== Trivia

talaria are the http://en.wikipedia.org/wiki/Talaria[winged sandals]
worn by Hermes in Greek mythology.
