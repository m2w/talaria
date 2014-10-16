// TODO: write tests
describe('talaria', function () {
    before(function () {
        talaria.test.init({USE_GISTS: true, GITHUB_USERNAME: 'm2w',
                           GIST_MAPPINGS: '/mappings.json'});
    });
    describe('using gists', function () {
        it('should retrieve all comments for a post');
        it('should display an error message when unable to locate a gist');
        it('should display an error when unable to load the gist<=>post mappings');
        it('should display an error message when exceeding GitHub API rate-limit');
        it('should cache any API interaction results');
    });
    describe('using commits', function () {
        it('should retrieve all comments for a post');
        it('should display an error message when exceeding GitHub API rate-limit');
        it('should cache any API interaction results');
    });
});
