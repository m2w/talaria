var insertionPointFinder = function(el) {
  return talaria.Talaria.parent(el, 'article');
};
var t = new talaria.Talaria({
  backend: talaria.Backend.Issues,
  mappingUrl: 'resources/mappings.json',
  github_username: 'm2w',
  github_repository: 'talaria',
  insertionPointLocator: insertionPointFinder
});
t.run();