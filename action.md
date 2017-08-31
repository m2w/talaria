---
layout: example
title: talaria in action
---

Here is a simple demo of talaria in action:

<div style="padding:0.5em; background-color: rgba(210,210,210,0.1); border-radius: 3px; border: 1px solid #e8e8e8;"
     id="test-area">
  {% include test-snippet.html %}
</div>

<button id="toggle-btn">Swap to the Gist backend</button>

Here's all the HTML that talaria needs:

{% highlight html %}
{% include test-snippet.html %}
{% endhighlight %}

A little bit of configuration:

<div id="issue-conf">
{% highlight js %}
 {% include talaria-run.issue.js %}
{% endhighlight %}
</div>

<div id="gist-conf" class="hidden">
{% highlight js %}
 {% include talaria-run.gist.js %}
{% endhighlight %}
</div>

and a simple mappings table, which links content on your page to its respective comments on Github:

```json
 {% include mappings.json %}
```