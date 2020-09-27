# Changelog

## 0.2.0 - 2020-09-27

### Added
- Features support empty arrays to indicate that the specific feature should be disable in every case.
### Changed
- **BREAKING-CHANGE** Removed support for Node < 10.


## 0.1.1 - 2020-09-25
### Changed
- Fixed the readme typos.

## 0.1.0 - 2020-09-25
### Added
- Initial release containing all the adaptations of the [Feature Policy](https://github.com/helmetjs/feature-policy) project to support the new `Permissions-Policy` header.
### Changed
- If you're migrating from the [Feature Policy](https://github.com/helmetjs/feature-policy) repo make note that for now on the reserved keywords don't need to be quoted but the specific feature values must be.
- Added errors to safeguard the usage with the newest changes.
- Reviewed all the tests.