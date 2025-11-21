# Changelog Extractor

Parse and extract structured information from [Keep a
Changelog](https://keepachangelog.com/) formatted changelogs. Available as both
a **GitHub Action** and a **CLI tool**.

## Features

- Parses Keep a Changelog format (tested with [Mantle Framework](https://github.com/alleyinteractive/mantle-framework) and others)
- Extract all versions or filter to a specific one
- Returns structured data with sections (Added, Changed, Fixed, etc.)
- Handles mixed formats, including versions without subsections
- Available as a CLI tool via npx or as a GitHub Action
- Written in plain JavaScript with no build step required

## Usage

### As a GitHub Action

#### Extract All Versions

### Extract All Versions

By default, the action returns all versions in the changelog:

```yaml
- name: Extract All Changelog Entries
  id: changelog
  uses: alleyinteractive/action-changelog-extractor@v1

- name: Process All Versions
  run: |
    # Access the first (latest) version
    echo '${{ fromJson(steps.changelog.outputs.result)[0].contents }}'
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

### Create Release from Latest Version

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

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          # Use the first (latest) version from the changelog
          body: ${{ fromJson(steps.changelog.outputs.result)[0].contents }}
```

#### Action Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `changelog-path` | Path to the changelog file | No | `CHANGELOG.md` |
| `version` | Specific version to extract (e.g., `1.14.0` or `v1.14.0`). Leave empty to return all versions. | No | _(returns all)_ |

#### Action Outputs

| Output | Description |
|--------|-------------|
| `result` | JSON string containing array of parsed version objects |

#### Output Structure

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

### As a CLI Tool

Run directly with npx (no installation required):

```bash
# Extract all versions from CHANGELOG.md
npx @alleyinteractive/changelog-extractor

# Extract specific version
npx @alleyinteractive/changelog-extractor CHANGELOG.md 1.14.0

# Count versions
npx @alleyinteractive/changelog-extractor -l

# Show help
npx @alleyinteractive/changelog-extractor --help
```

Or install globally:

```bash
npm install -g @alleyinteractive/changelog-extractor
changelog-extractor
```

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

## CLI Options

```
Usage: changelog-extractor [options] [changelog-file] [version]

Options:
  -l, --list     List the count of versions found and exit
  -h, --help     Show help message

Arguments:
  changelog-file  Path to changelog file (default: CHANGELOG.md)
  version        Specific version to extract (e.g., "1.14.0" or "v1.14.0")
                 Leave empty to return all versions
```

## Programmatic Usage

You can also use the parser directly in your Node.js code:

```javascript
const { parseChangelog } = require('@alleyinteractive/changelog-extractor');
const fs = require('fs');

const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');

// Get all versions
const allVersions = parseChangelog(changelog);

// Get specific version
const v1 = parseChangelog(changelog, '1.14.0');

console.log(JSON.stringify(allVersions, null, 2));
```

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

### Local Testing

```bash
# Test the CLI locally
node cli.js
node cli.js -l
node cli.js CHANGELOG.md 1.0.0
```

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Credits

This project is actively maintained by [Alley Interactive](https://github.com/alleyinteractive).

- [Sean Fisher](https://github.com/srtfisher)

## License

The GNU General Public License (GPL) license. Please see [License File](LICENSE) for more information.