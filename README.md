# Changelog Extractor Action

A GitHub Action that parses [Keep a Changelog](https://keepachangelog.com/) formatted changelog files and extracts structured version information for use in release workflows and other automation.

## Features

- 📝 Parses Keep a Changelog format (like [Mantle Framework](https://github.com/alleyinteractive/mantle-framework))
- 🎯 Extract specific versions or the latest release
- 📦 Returns structured data with sections (Added, Changed, Fixed, etc.)
- ✅ Comprehensive Jest test suite
- 🚀 Zero build step - pure JavaScript

## Usage

### Basic Example

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Extract Changelog
        id: changelog
        uses: alleyinteractive/action-changelog-extractor@v1
        with:
          version: 'latest'

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body: ${{ fromJson(steps.changelog.outputs.result)[0].contents }}
```

### Extract Specific Version

```yaml
- name: Extract v1.14.0 Changelog
  id: changelog
  uses: alleyinteractive/action-changelog-extractor@v1
  with:
    changelog-path: 'CHANGELOG.md'
    version: '1.14.0'  # or 'v1.14.0'
```

### Use Individual Sections

```yaml
- name: Extract Changelog
  id: changelog
  uses: alleyinteractive/action-changelog-extractor@v1

- name: Process Sections
  run: |
    echo "Added features:"
    echo '${{ fromJson(steps.changelog.outputs.result)[0].sections.added }}'

    echo "Bug fixes:"
    echo '${{ fromJson(steps.changelog.outputs.result)[0].sections.fixed }}'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `changelog-path` | Path to the changelog file | No | `CHANGELOG.md` |
| `version` | Version to extract (`latest`, `1.14.0`, or `v1.14.0`) | No | `latest` |

## Outputs

| Output | Description |
|--------|-------------|
| `result` | JSON string containing array of parsed version objects |

### Output Structure

The `result` output is a JSON string that can be parsed with `fromJson()`:

```json
[
  {
    "name": "1.14.0",
    "sections": {
      "added": "- Added feature A\n- Added feature B",
      "changed": "- Changed behavior X",
      "fixed": "- Fixed bug Y"
    },
    "contents": "### Added\n\n- Added feature A\n- Added feature B\n\n### Changed\n\n- Changed behavior X\n\n### Fixed\n\n- Fixed bug Y"
  }
]
```

**Properties:**
- `name` - Version number without "v" prefix
- `sections` - Object with lowercase keys (`added`, `changed`, `fixed`, `deprecated`, `removed`, `security`)
- `contents` - Full markdown content for the version (all sections combined, without version header)

## Supported Changelog Format

This action parses changelogs following the [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

## v1.14.0

### Added
- New feature description

### Changed
- Changes made

### Fixed
- Bugs fixed

## v1.13.0 - 2024-08-15

### Added
- Another feature
```

**Supported section types:**
- Added
- Changed
- Deprecated
- Removed
- Fixed
- Security

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
npm install
```

### Running Tests

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Testing Locally

You can test the parser directly:

```javascript
const { parseChangelog } = require('./src/parser');
const fs = require('fs');

const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
const results = parseChangelog(changelog, 'latest');
console.log(JSON.stringify(results, null, 2));
```

## License

GPL-3.0 - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

Maintained by [Alley Interactive](https://github.com/alleyinteractive).
