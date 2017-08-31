# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2017-08-31

## Added

- support for issue-based comments
- `CHANGELOG.md`
- travis-CI

## Changed

- rewrite talaria in typescript: only support "modern" browsers (sorry IE) due to usage of `Promise`, as a consequence talaria now has 0 external dependencies!
- restructure/rethink CSS classes and the rendered DOM structure of comments
- change he default style has been updated to reflect the current Github look'n'feel
- add additional configuration options
- improve documentation
- automate testing

## Removed

- support for commit-based comments. Using commit-comments is error-prone, difficult to optimize and generally not very user-friendly. It originally seemed like a great idea (and does/did work ok), it isn't an approach that scales easily and requires too much care on behalf of users to get right.
- support for IE