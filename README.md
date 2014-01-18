# What?

_talaria_ is a commenting system for static content, such as github pages. Instead of github issues, it is based on commit comments.
You can see it in action [here](http://blog.tibidat.com).

The name _talaria_ comes from the [winged sandals](http://en.wikipedia.org/wiki/Talaria) worn by Hermes in Greek mythology.

# Why?

Because I personally find the approach using github issues less than ideal. 
Commit comments have the advantage of being directly "attached" to the relevant file.

# How?

See [m2w.github.com/talaria/](http://m2w.github.com/talaria/) for the full documentation.

- add `talaria.js` and `talaria.css` to your static site
- change the config vars in `talaria.js` to point to your github repository
- make sure each content block has a permalink and is encapsulated by a `<article>` element
- add the *contents* of `talaria-wrapper.html` where the comments should appear within the `<article>`
- add the *contents* of `talaria-comment.html` anywhere within the page
- `talaria.js` requires jquery

# TODOs

- [ ] review performance and caching
- [ ] gracefull error handling (e.g. when exceeding `X-RateLimit-Limit`)
