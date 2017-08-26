var t = new talaria.Talaria({
  backend: talaria.Backend.Issues,
  mappingUrl: 'resources/mappings.json',
  github_username: 'm2w',
  github_repository: 'talaria'
});
t.run();