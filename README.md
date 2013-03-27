# What?

talaria is a commenting system for static content, such as github pages. Instead of github issues, it is based on commit comments.

The name talaria comes from the [winged sandals](http://en.wikipedia.org/wiki/Talaria) worn by Hermes in Greek mythology.

# Why?

Because I personally find the approach using github issues less than ideal. Commit comments have the advantage of being directly "attached" to the relevant file.

# How?

Using talaria on your own blog is pretty straightforward. For the following, I'm going to presume that your blog is jekyll based:

1. inside your blog's repository: `git submodule add https://github.com/m2w/talaria.git talaria`
    
2. `cd talaria && ./init`. The init scripts allows for limited customization, check `./init -h`. Please note that I only tested the script on OSX.

3. [register a github OAuth application](https://github.com/settings/applications/new) for your domain

4. include `comments-placeholder.html` in your content container and `comments-template.html` in the footer of your base template. Also add links to `talaria.js` and `talaria.css`. Note that the link to `talaria.css` is optional: if you use SASS, you can just add `@import "talaria";` to your main SASS file and compile it all to a single file (which I recommend):

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

5. customize `talaria.scss` as required

# TODOs

- [ ] review performance and caching
- [ ] code cleanup
- [ ] make the init script more portable
- [ ] add more documentation
- [ ] gracefull error handling (e.g. when exceeding the `X-RateLimit-Limit`)
