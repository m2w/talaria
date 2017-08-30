# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## Added

- support for issue-based comments
- `CHANGELOG.md`

## Changed

- talaria has undergone a complete rewrite. It is now written in typescript, and only supports "modern" browsers (sorry IE) due to its use of `Promise`. This means that talaria now has 0 external dependencies!
- CSS classes and the rendered DOM structure of comments has changed drastically. The default style has been updated to reflect the current Github look'n'feel
- added additional configuration options
- improved documentation
- automated testing
- added CI

## Removed

- dropped support for commit-based comments. Using commit-comments is error-prone, difficult to optimize and generally not very user-friendly. It originally seemed like a great idea (and does/did work ok), it isn't an approach that scales easily and requires too much care on behalf of users to get right.
- dropped support for IE