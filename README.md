# What?

talaria is a commenting system for static content, such as github pages. Instead of github issues, it is based on commit comments.

The name talaria comes from the [winged sandals](http://en.wikipedia.org/wiki/Talaria) worn by Hermes in Greek mythology.

# Why?

Because I personally find the approach using github issues less than ideal. Commit comments have the advantage of being directly "attached" to the relevant file.

# How?

Using talaria on your own blog is pretty straightforward. For the following, I'm going to presume that your blog is jekyll based:

1. Inside your blog's repository: `git submodule add https://github.com/m2w/talaria.git talaria`

2. `cp -i talaria/_includes/* _includes/`, `cp -i talaria/static/js/talaria.js <your_js_dir>`.
    Then, if you use compass: `cp -i talaria/_sass/talaria.scss <your_sass_dir>/_talaria.scss` and `@import "talaria";` in your main SASS file
    If not, `cp -i talaria/static/css/talaria.css <your_css_dir>`.

3. [register a github OAuth application](https://github.com/settings/applications/new) for your domain

4. Include `comments-placeholder.html` in your content container and `comments-template.html` in the footer of your base template. Next add links to `talaria.js` and `talaria.css` as required in your templates. A fully rendered page should look structurally similar to the following:
    ```html
    ...
        <script type="text/javascript" src="/path/to/talaria.js"></script>
        <link href="/static/css/talaria.css" rel="stylesheet" type="text/css" />
    ...
        <article>
            <header><a class="permalink" href="/permalink-to-post">A post</a></header>
            ...
            {% include comments-placeholder.html %}
        </article>
    ...
        <footer>
            {% include comments-template.html %}
        </footer>
    ...
    ```

5. Add talaria to `exclude` in your `_config.yml`

6. Customize `talaria.scss` or `talaria.css` as required

# TODOs

- [ ] review performance and caching
- [ ] code cleanup
- [ ] make the init script more portable
- [ ] add more documentation
- [ ] gracefull error handling (e.g. when exceeding the `X-RateLimit-Limit`)
