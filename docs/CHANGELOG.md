# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.2] - 2025-12-13

### Added
- Buy Me a Coffee support badge in README
- Support section in README with donation information
- Footer link in admin sidebar for supporter attribution
- Monetization support via Buy Me a Coffee platform

### Changed
- Enhanced README with community support section
- Updated branding documentation for poweredBy footer link

## [1.0.1] - 2025-12-12

### Fixed
- README.md branding section now accurately describes config-based approach
- Removed non-functional branding settings page
- Corrected role-based access control documentation with all 4 built-in roles
- Documentation now matches actual codebase implementation

## [1.0.0] - 2025-12-12

### Added
- Complete admin UI internationalization system (English and Spanish)
- User language preference system with immediate application
- Profile dropdown menu with language switcher
- Translation completion tracking per locale
- Visual indicators for translatable fields
- Locale persistence across user sessions

### Fixed
- JSON syntax error in English locale file (missing comma)
- Undefined `t()` function error in user edit page
- Module build compilation issues
- Locale changes now apply immediately without page reload

### Changed
- All admin pages now fully translated (9 pages total)
- Users, Roles, Singletons, Dashboard, and Settings pages support i18n
- Improved user experience with instant language switching
- Stable production-ready release

## [0.6.0] - 2025-12-11

### Added
- Avatar display in user sidebar and tables with fallback to initials
- User locale preferences system for personalized language settings
- Migration scripts for upgrading admin users to super_admin role
- Comprehensive roadmap documentation for v1.0
- Project status documentation
- Complete design system consistency across all field components

### Fixed
- Avatar upload now saves full URL instead of filename for proper rendering
- Avatar preview handling supports both legacy (filename) and new (URL) formats
- Settings route 404 error resolved by moving navigation to onMounted lifecycle
- Relation field component now follows standard design system (removed Nuxt UI dependencies)
- URL field component now follows standard design system (removed Nuxt UI dependencies)
- Translatable badge visibility improved with white icon on primary background
- Image field preview URL construction now handles both `/api` and `http` prefixes

### Changed
- Organized all documentation into /docs folder
- Improved backward compatibility for avatar field data

## [0.5.0] - 2025-12-11

### Added
- Image upload field for user avatars (replacing URL input)
- Support for direct avatar image upload with 5MB size limit
- Accept PNG, JPEG, JPG, and WEBP formats for avatars

### Changed
- Replaced native select elements with custom Select component in user forms
- Improved login page UX with centered logo design
- Login title and description are now optional via branding config
- Enhanced logo presentation consistency across all screen sizes
- Removed redundant "Save Draft" button from collection editor
- Changed default admin credentials to superadmin/superadmin123
- User card now displays @username format and role displayName
- Radio and Checkbox components now use CSS variables for custom theme colors
- Custom Select hover state now shows white text on primary background
- System role badges now display white text on colored backgrounds

### Fixed
- Color consistency across all components using primary color backgrounds
- Sidebar logo sizing (previously showing 0x0)
- Translation badge text color on primary background
- Select field hover state contrast

## [0.4.0] - 2025-12-10

### Added
- Custom Tags field component with suggestions, keyboard navigation, and validation
- Custom Time picker component with 12-hour format and AM/PM selection
- Custom Datetime picker component combining date and time selection with tabs
- Registered Tags field type in the field type system

### Changed
- Improved theming consistency across all admin pages
- Replaced hardcoded primary colors with CSS variables (`--cms-primary`, `--cms-primary-hover`, `--cms-primary-light`)
- Updated all form inputs, buttons, checkboxes, and badges to use centralized theming

### Fixed
- Search input focus styles now use theme colors
- System role badges now use theme colors
- Permission checkboxes now use theme colors
- All button hover states now use theme colors consistently

## [0.3.0] - 2024-XX-XX

### Added
- Icon field type with Heroicons support
- Branding configuration with primaryColor theming
- Custom field components following shadcn-vue patterns

### Changed
- Improved UI consistency across admin panels

## [0.2.0] - 2024-XX-XX

### Added
- Multi-database support (SQLite, PostgreSQL)
- i18n support for content
- Role-based permissions system

## [0.1.0] - 2024-XX-XX

### Added
- Initial release
- Basic CMS functionality
- Collections and Singletons
- Media management
- User authentication

[Unreleased]: https://github.com/neskeep/nuxt-cms-module/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/neskeep/nuxt-cms-module/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/neskeep/nuxt-cms-module/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/neskeep/nuxt-cms-module/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/neskeep/nuxt-cms-module/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/neskeep/nuxt-cms-module/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/neskeep/nuxt-cms-module/releases/tag/v0.1.0
