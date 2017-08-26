---
layout: example
title: talaria in action
---

Here is a simple demo of talaria in action:

<div style="padding:0.5em; background-color: rgba(210,210,210,0.1); border-radius: 3px; border: 1px solid #e8e8e8;">
  {% include test-snippet.html %}
</div>

Here's all the HTML that talaria needs:

{% highlight html %}
{% include test-snippet.html %}
{% endhighlight %}

A little bit of configuration:

```js
 {% include talaria-run.js %}
```

and a simple mappings table, which links content on your page to its respective comments on Github:

```json
 {% include mappings.json %}
```