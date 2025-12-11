import { parseChangelog } from '../src/parser.js'

// Sample changelog content based on Mantle Framework format
const sampleChangelog = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v1.14.0

### Added

- Added \`laravel/serializable-closure\` as a dependency to \`mantle-framework/support\` to support serialization of closures.
- Added support for \`Mantle\\Types\\Validator\` attributes on service providers to conditionally boot them based on custom logic.
- Added \`Mantle\\Types\\Attributes\\Admin\` and \`Mantle\\Types\\Attributes\\Request\` validator attributes.

### Changed

- **Bumped minimum PHPUnit version to \`10.0.7\`.**

  New projects should not pin a version and inherit the latest from the framework or \`mantle-framework/testing\`.
- **📌 Potentially breaking change: 📌** Backup and restore WordPress globals (\`wp_post_statuses\`, \`wp_post_types\`, and \`wp_taxonomies\`) before any test runs and then restore it before each test to prevent side effects from tests that modify these globals.

### Fixed

- Post meta is no longer unregistered on tearDown. You can now opt into unregistering all meta using the \`Unregister_All_Meta_Keys\` trait.
- The framework is now compatible with PHPStan level 8. Many types have been added throughout the framework to support this.

## v1.13.4

- Bump \`symfony/http-foundation\` to \`^7.3.7\` to address security issue.

## v1.13.3

No changes, re-released to fix a bad tag.

## v1.13.2

### Fixed

- Fixed issue where \`is_dir()\` is called with multiple arguments in the console kernel.

## v1.13.1 - 2024-08-15

### Fixed

- Fixed issue with \`wpmu_delete_blog()\` not being loaded before use.

## v1.13.0

### Added

- Added \`scheduled()\` state to post factory to create scheduled posts.
- Added \`create_ordered_set_and_get()\` method to factories to create and retrieve an ordered set of models.

### Changed

- Clear \`$_COOKIE\` and \`$_SESSION\` in addition to other superglobals when cleaning the global scope between tests.

### Fixed

- Fixed issue where \`Mantle\\Types\\Validator\` is used within \`mantle-framework/support\` but \`mantle-framework/types\` is not a dependency.
`

describe('parseChangelog', () => {
  describe('version extraction', () => {
    test('extracts all versions when no version specified', () => {
      const results = parseChangelog(sampleChangelog, null)

      expect(results).toHaveLength(6)
      expect(results[0].name).toBe('1.14.0')
      expect(results[1].name).toBe('1.13.4')
      expect(results[2].name).toBe('1.13.3')
      expect(results[3].name).toBe('1.13.2')
      expect(results[4].name).toBe('1.13.1')
      expect(results[5].name).toBe('1.13.0')
    })

    test('extracts all versions by default', () => {
      const results = parseChangelog(sampleChangelog)

      expect(results).toHaveLength(6)
      expect(results[0].name).toBe('1.14.0')
    })

    test('extracts specific version without v prefix', () => {
      const results = parseChangelog(sampleChangelog, '1.13.2')

      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('1.13.2')
    })

    test('extracts specific version with v prefix', () => {
      const results = parseChangelog(sampleChangelog, 'v1.13.2')

      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('1.13.2')
    })

    test('returns empty array for non-existent version', () => {
      const results = parseChangelog(sampleChangelog, '99.99.99')

      expect(results).toHaveLength(0)
    })

    test('version name does not include v prefix', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0')

      expect(results[0].name).toBe('1.14.0')
      expect(results[0].name).not.toContain('v')
    })
  })

  describe('section parsing', () => {
    test('parses Added section correctly', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0')

      expect(results[0].sections.added).toBeDefined()
      expect(results[0].sections.added).toContain(
        'laravel/serializable-closure'
      )
      expect(results[0].sections.added).toContain('Mantle\\Types\\Validator')
    })

    test('parses Changed section correctly', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0')

      expect(results[0].sections.changed).toBeDefined()
      expect(results[0].sections.changed).toContain('PHPUnit version')
      expect(results[0].sections.changed).toContain(
        '📌 Potentially breaking change'
      )
    })

    test('parses Fixed section correctly', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0')

      expect(results[0].sections.fixed).toBeDefined()
      expect(results[0].sections.fixed).toContain(
        'Post meta is no longer unregistered'
      )
      expect(results[0].sections.fixed).toContain('PHPStan level 8')
    })

    test('section keys are lowercase', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0')

      expect(Object.keys(results[0].sections)).toEqual([
        'added',
        'changed',
        'fixed'
      ])
    })

    test('handles version with no sections', () => {
      const results = parseChangelog(sampleChangelog, '1.13.3')

      expect(results[0].sections.general).toBeDefined()
      expect(results[0].sections.general).toContain(
        'No changes, re-released to fix a bad tag'
      )
    })

    test('handles version with content but no section headers', () => {
      const results = parseChangelog(sampleChangelog, '1.13.4')

      // Content without section headers should be in general section
      expect(results[0].sections.general).toBeDefined()
      expect(results[0].sections.general).toContain('symfony/http-foundation')
    })
  })

  describe('contents generation', () => {
    test('contents includes all sections without version header', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0')

      expect(results[0].contents).toBeDefined()
      expect(results[0].contents).toContain('### Added')
      expect(results[0].contents).toContain('### Changed')
      expect(results[0].contents).toContain('### Fixed')
      expect(results[0].contents).not.toContain('## v1.14.0')
      expect(results[0].contents).not.toContain('## 1.14.0')
    })

    test('contents combines all section content', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0')

      expect(results[0].contents).toContain('laravel/serializable-closure')
      expect(results[0].contents).toContain('PHPUnit version')
      expect(results[0].contents).toContain(
        'Post meta is no longer unregistered'
      )
    })

    test('contents includes general section for version without subsections', () => {
      const results = parseChangelog(sampleChangelog, '1.13.3')

      expect(results[0].contents).toBeTruthy()
      expect(results[0].contents).toContain(
        'No changes, re-released to fix a bad tag'
      )
    })

    test('sections maintain markdown formatting', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0')

      expect(results[0].contents).toContain('- Added')
      expect(results[0].contents).toContain('**Bumped minimum PHPUnit version')
    })
  })

  describe('edge cases', () => {
    test('handles empty changelog', () => {
      const results = parseChangelog('', 'latest')

      expect(results).toHaveLength(0)
    })

    test('handles changelog with only header', () => {
      const changelog = '# Changelog\n\nSome intro text.'
      const results = parseChangelog(changelog, 'latest')

      expect(results).toHaveLength(0)
    })

    test('handles version with date suffix', () => {
      const results = parseChangelog(sampleChangelog, '1.13.1')

      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('1.13.1')
    })

    test('handles multiple versions with same sections', () => {
      const results = parseChangelog(sampleChangelog, null)

      const versionsWithFixed = results.filter((v) => v.sections.fixed)
      expect(versionsWithFixed.length).toBeGreaterThan(1)
    })

    test('preserves multiline content within sections', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0')

      expect(results[0].sections.changed).toContain(
        'New projects should not pin a version'
      )
    })

    test('unwraps text that is wrapped across multiple lines', () => {
      const wrappedChangelog = `# Changelog

## v1.2.0

- Adjust taxonomy labels
in the meta box to be more user friendly for taxonomies
  without a label
provided.
- Sort meta
keys alphabetically by default. Added filter
  \`meta_inspector_sort_meta\` to
disable this behavior.
- Simple single line item.

### Added

- Add support for
BuddyPress Activity Meta that spans
  multiple lines with indentation
  and continues here.
- Another item that should remain
  on one line.
`

      const results = parseChangelog(wrappedChangelog, '1.2.0')

      // Check that wrapped text in general section gets unwrapped
      expect(results[0].sections.general).toContain(
        'Adjust taxonomy labels in the meta box to be more user friendly for taxonomies without a label provided.'
      )
      expect(results[0].sections.general).toContain(
        'Sort meta keys alphabetically by default. Added filter `meta_inspector_sort_meta` to disable this behavior.'
      )
      expect(results[0].sections.general).toContain('Simple single line item.')

      // Check that wrapped text in Added section gets unwrapped
      expect(results[0].sections.added).toContain(
        'Add support for BuddyPress Activity Meta that spans multiple lines with indentation and continues here.'
      )
      expect(results[0].sections.added).toContain(
        'Another item that should remain on one line.'
      )
    })

    test('preserves proper sentence boundaries while unwrapping hard-wrapped text', () => {
      const mixedChangelog = `# Changelog

## v1.0.0

- This is a complete sentence.
- Another complete sentence here.
- But this line
  should be joined because it flows naturally
  across multiple lines with proper indentation.
- Items with code \`should_not\` stay intact.

### Fixed

- Fixed issue where something happened.
- Fixed another issue that spans
  multiple lines and should
  be unwrapped properly.
`

      const results = parseChangelog(mixedChangelog, '1.0.0')

      // Should preserve complete sentences
      expect(results[0].sections.general).toContain(
        'This is a complete sentence.'
      )
      expect(results[0].sections.general).toContain(
        'Another complete sentence here.'
      )

      // Should unwrap indented continuations
      expect(results[0].sections.general).toContain(
        'But this line should be joined because it flows naturally across multiple lines with proper indentation.'
      )

      // Should preserve code on same line
      expect(results[0].sections.general).toContain(
        'Items with code `should_not` stay intact.'
      )

      // Should unwrap in Fixed section
      expect(results[0].sections.fixed).toContain(
        'Fixed another issue that spans multiple lines and should be unwrapped properly.'
      )
    })

    test('handles changelog with mixed wrapped and non-wrapped text', () => {
      const mixedWrappingChangelog = `# Changelog

## v1.5.0

- This is a normal single line item that should stay as-is.
- Update dependency package
  to version 2.0 for better performance
  and security improvements.
- Fix bug in authentication system.
- Refactor database connection logic
for improved stability and error handling
  to ensure reliable connections.
- Add new feature for user management.

### Added

- New user dashboard with complete functionality.
- Support for multiple authentication
  providers including OAuth, SAML,
  and traditional login methods.
- Simple configuration option.

### Changed

- Updated API endpoints for better consistency.
- Modified error handling
  throughout the application to provide
  more detailed feedback to users.
- Cleaned up unused code.
`

      const results = parseChangelog(mixedWrappingChangelog, '1.5.0')

      // Check general section - mix of wrapped and unwrapped
      expect(results[0].sections.general).toContain(
        'This is a normal single line item that should stay as-is.'
      )
      expect(results[0].sections.general).toContain(
        'Update dependency package to version 2.0 for better performance and security improvements.'
      )
      expect(results[0].sections.general).toContain(
        'Fix bug in authentication system.'
      )
      expect(results[0].sections.general).toContain(
        'Refactor database connection logic for improved stability and error handling to ensure reliable connections.'
      )
      expect(results[0].sections.general).toContain(
        'Add new feature for user management.'
      )

      // Check Added section - mix of wrapped and unwrapped
      expect(results[0].sections.added).toContain(
        'New user dashboard with complete functionality.'
      )
      expect(results[0].sections.added).toContain(
        'Support for multiple authentication providers including OAuth, SAML, and traditional login methods.'
      )
      expect(results[0].sections.added).toContain(
        'Simple configuration option.'
      )

      // Check Changed section - mix of wrapped and unwrapped
      expect(results[0].sections.changed).toContain(
        'Updated API endpoints for better consistency.'
      )
      expect(results[0].sections.changed).toContain(
        'Modified error handling throughout the application to provide more detailed feedback to users.'
      )
      expect(results[0].sections.changed).toContain('Cleaned up unused code.')
    })
  })

  describe('output structure', () => {
    test('each result has required properties', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0')

      expect(results[0]).toHaveProperty('name')
      expect(results[0]).toHaveProperty('sections')
      expect(results[0]).toHaveProperty('contents')
    })

    test('name is a string', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0')

      expect(typeof results[0].name).toBe('string')
    })

    test('sections is an object', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0')

      expect(typeof results[0].sections).toBe('object')
      expect(Array.isArray(results[0].sections)).toBe(false)
    })

    test('contents is a string', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0')

      expect(typeof results[0].contents).toBe('string')
    })
  })

  describe('mixed format support', () => {
    const mixedChangelog = `# Changelog

## 3.9.1

### Added

* Feature A with subsection
* Feature B with subsection

### Changed

* Change with subsection

### Fixed

* Fix with subsection

## 3.9.0

* Added support for something without subsections.

## 3.8.0

### Changed

* Only has a changed section

## 3.7.0

* Single line without subsection

## 3.6.0

### Added

* Has an added section

### Fixed

* Also has a fixed section
`

    test('handles version with only general content (no subsections)', () => {
      const results = parseChangelog(mixedChangelog, '3.9.0')

      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('3.9.0')
      expect(results[0].sections.general).toBeDefined()
      expect(results[0].sections.general).toContain(
        'Added support for something without subsections'
      )
    })

    test('handles version with mixed subsections and general content', () => {
      const results = parseChangelog(mixedChangelog, '3.9.1')

      expect(results).toHaveLength(1)
      expect(results[0].sections.added).toBeDefined()
      expect(results[0].sections.changed).toBeDefined()
      expect(results[0].sections.fixed).toBeDefined()
      expect(results[0].sections.general).toBeUndefined()
    })

    test('general section is included in contents', () => {
      const results = parseChangelog(mixedChangelog, '3.9.0')

      expect(results[0].contents).toBeTruthy()
      expect(results[0].contents).toContain(
        'Added support for something without subsections'
      )
      expect(results[0].contents).not.toContain('### General')
    })

    test('general section appears without header in contents', () => {
      const results = parseChangelog(mixedChangelog, '3.7.0')

      expect(results[0].sections.general).toBeDefined()
      expect(results[0].contents).toBe('* Single line without subsection')
    })

    test('extracts all versions with mixed formats', () => {
      const results = parseChangelog(mixedChangelog, null)

      expect(results).toHaveLength(5)

      // 3.9.1 has subsections
      expect(results[0].sections.added).toBeDefined()
      expect(results[0].sections.general).toBeUndefined()

      // 3.9.0 has only general content
      expect(results[1].sections.general).toBeDefined()
      expect(Object.keys(results[1].sections)).toEqual(['general'])

      // 3.8.0 has only changed subsection
      expect(results[2].sections.changed).toBeDefined()
      expect(results[2].sections.general).toBeUndefined()

      // 3.7.0 has only general content
      expect(results[3].sections.general).toBeDefined()

      // 3.6.0 has subsections
      expect(results[4].sections.added).toBeDefined()
      expect(results[4].sections.fixed).toBeDefined()
    })

    test('general content preserves formatting', () => {
      const results = parseChangelog(mixedChangelog, '3.9.0')

      expect(results[0].sections.general).toContain('*')
      expect(results[0].sections.general.trim()).toBe(
        '* Added support for something without subsections.'
      )
    })
  })
})
