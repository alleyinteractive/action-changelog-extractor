const { parseChangelog } = require('../src/parser');

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
`;

describe('parseChangelog', () => {
  describe('version extraction', () => {
    test('extracts all versions when no version specified', () => {
      const results = parseChangelog(sampleChangelog, null);

      expect(results).toHaveLength(6);
      expect(results[0].name).toBe('1.14.0');
      expect(results[1].name).toBe('1.13.4');
      expect(results[2].name).toBe('1.13.3');
      expect(results[3].name).toBe('1.13.2');
      expect(results[4].name).toBe('1.13.1');
      expect(results[5].name).toBe('1.13.0');
    });

    test('extracts latest version', () => {
      const results = parseChangelog(sampleChangelog, 'latest');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('1.14.0');
    });

    test('extracts specific version without v prefix', () => {
      const results = parseChangelog(sampleChangelog, '1.13.2');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('1.13.2');
    });

    test('extracts specific version with v prefix', () => {
      const results = parseChangelog(sampleChangelog, 'v1.13.2');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('1.13.2');
    });

    test('returns empty array for non-existent version', () => {
      const results = parseChangelog(sampleChangelog, '99.99.99');

      expect(results).toHaveLength(0);
    });

    test('version name does not include v prefix', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0');

      expect(results[0].name).toBe('1.14.0');
      expect(results[0].name).not.toContain('v');
    });
  });

  describe('section parsing', () => {
    test('parses Added section correctly', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0');

      expect(results[0].sections.added).toBeDefined();
      expect(results[0].sections.added).toContain('laravel/serializable-closure');
      expect(results[0].sections.added).toContain('Mantle\\Types\\Validator');
    });

    test('parses Changed section correctly', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0');

      expect(results[0].sections.changed).toBeDefined();
      expect(results[0].sections.changed).toContain('PHPUnit version');
      expect(results[0].sections.changed).toContain('📌 Potentially breaking change');
    });

    test('parses Fixed section correctly', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0');

      expect(results[0].sections.fixed).toBeDefined();
      expect(results[0].sections.fixed).toContain('Post meta is no longer unregistered');
      expect(results[0].sections.fixed).toContain('PHPStan level 8');
    });

    test('section keys are lowercase', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0');

      expect(Object.keys(results[0].sections)).toEqual(['added', 'changed', 'fixed']);
    });

    test('handles version with no sections', () => {
      const results = parseChangelog(sampleChangelog, '1.13.3');

      expect(results[0].sections).toEqual({});
    });

    test('handles version with content but no section headers', () => {
      const results = parseChangelog(sampleChangelog, '1.13.4');

      // Content without section headers should not be captured
      expect(Object.keys(results[0].sections)).toHaveLength(0);
    });
  });

  describe('contents generation', () => {
    test('contents includes all sections without version header', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0');

      expect(results[0].contents).toBeDefined();
      expect(results[0].contents).toContain('### Added');
      expect(results[0].contents).toContain('### Changed');
      expect(results[0].contents).toContain('### Fixed');
      expect(results[0].contents).not.toContain('## v1.14.0');
      expect(results[0].contents).not.toContain('## 1.14.0');
    });

    test('contents combines all section content', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0');

      expect(results[0].contents).toContain('laravel/serializable-closure');
      expect(results[0].contents).toContain('PHPUnit version');
      expect(results[0].contents).toContain('Post meta is no longer unregistered');
    });

    test('contents is empty for version with no sections', () => {
      const results = parseChangelog(sampleChangelog, '1.13.3');

      expect(results[0].contents).toBe('');
    });

    test('sections maintain markdown formatting', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0');

      expect(results[0].contents).toContain('- Added');
      expect(results[0].contents).toContain('**Bumped minimum PHPUnit version');
    });
  });

  describe('edge cases', () => {
    test('handles empty changelog', () => {
      const results = parseChangelog('', 'latest');

      expect(results).toHaveLength(0);
    });

    test('handles changelog with only header', () => {
      const changelog = '# Changelog\n\nSome intro text.';
      const results = parseChangelog(changelog, 'latest');

      expect(results).toHaveLength(0);
    });

    test('handles version with date suffix', () => {
      const results = parseChangelog(sampleChangelog, '1.13.1');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('1.13.1');
    });

    test('handles multiple versions with same sections', () => {
      const results = parseChangelog(sampleChangelog, null);

      const versionsWithFixed = results.filter(v => v.sections.fixed);
      expect(versionsWithFixed.length).toBeGreaterThan(1);
    });

    test('preserves multiline content within sections', () => {
      const results = parseChangelog(sampleChangelog, '1.14.0');

      expect(results[0].sections.changed).toContain('New projects should not pin a version');
    });
  });

  describe('output structure', () => {
    test('each result has required properties', () => {
      const results = parseChangelog(sampleChangelog, 'latest');

      expect(results[0]).toHaveProperty('name');
      expect(results[0]).toHaveProperty('sections');
      expect(results[0]).toHaveProperty('contents');
    });

    test('name is a string', () => {
      const results = parseChangelog(sampleChangelog, 'latest');

      expect(typeof results[0].name).toBe('string');
    });

    test('sections is an object', () => {
      const results = parseChangelog(sampleChangelog, 'latest');

      expect(typeof results[0].sections).toBe('object');
      expect(Array.isArray(results[0].sections)).toBe(false);
    });

    test('contents is a string', () => {
      const results = parseChangelog(sampleChangelog, 'latest');

      expect(typeof results[0].contents).toBe('string');
    });
  });
});
