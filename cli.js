#!/usr/bin/env node

/**
 * Changelog Extractor CLI
 *
 * Parse and extract structured information from Keep a Changelog formatted files.
 * Can be run via npx or installed globally.
 *
 * @package @alleyinteractive/changelog-extractor
 * @author Alley Interactive
 * @license GPL-3.0
 */

const fs = require('fs');
const path = require('path');
const { parseChangelog } = require('./src/parser');

function printUsage() {
  console.log(`
Usage: npx @alleyinteractive/changelog-extractor [options]

Options:
  -f, --file <path>     Path to changelog file (default: CHANGELOG.md)
  -v, --version <ver>   Specific version to extract (e.g., "1.14.0" or "v1.14.0")
                        Leave empty to return all versions
  -l, --list            List the count of versions found and exit
  -h, --help            Show this help message

Examples:
  npx @alleyinteractive/changelog-extractor                      # Parse CHANGELOG.md, all versions
  npx @alleyinteractive/changelog-extractor -l                   # Count versions in CHANGELOG.md
  npx @alleyinteractive/changelog-extractor -v 1.14.0            # Extract specific version
  npx @alleyinteractive/changelog-extractor -f /tmp/test.md      # Parse specific file
  npx @alleyinteractive/changelog-extractor -f CHANGELOG.md -v 1.14.0  # Both options
  changelog-extractor -l                                         # If installed globally
`);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printUsage();
  process.exit(0);
}

const listMode = args.includes('-l') || args.includes('--list');

// Parse file option
let changelogFile = 'CHANGELOG.md';
const fileIndex = args.findIndex(arg => arg === '-f' || arg === '--file');
if (fileIndex !== -1 && args[fileIndex + 1]) {
  changelogFile = args[fileIndex + 1];
}

// Parse version option
let versionArg = null;
const versionIndex = args.findIndex(arg => arg === '-v' || arg === '--version');
if (versionIndex !== -1 && args[versionIndex + 1]) {
  versionArg = args[versionIndex + 1];
}

const version = versionArg;

// Read changelog file
const changelogPath = path.resolve(process.cwd(), changelogFile);

if (!fs.existsSync(changelogPath)) {
  console.error(`❌ Error: Changelog file not found: ${changelogPath}`);
  console.error('\nTip: You can create a test changelog at /tmp/test-changelog.md');
  process.exit(1);
}

const changelogContent = fs.readFileSync(changelogPath, 'utf8');

try {
  const results = parseChangelog(changelogContent, version);

  // List mode: just display count and exit
  if (listMode) {
    console.log(`${results.length}`);
    process.exit(0);
  }

  // Parse changelog
  console.log(`📖 Parsing: ${changelogPath}`);
  console.log(`🎯 Version: ${versionArg || 'all versions'}`);
  console.log('');

  if (results.length === 0) {
    console.log('⚠️  No changelog entries found');
    process.exit(1);
  }

  console.log(`✅ Found ${results.length} version(s)\n`);
  console.log('─'.repeat(80));

  // Pretty print results
  results.forEach((entry, index) => {
    console.log(`\n📦 Version: ${entry.name}`);
    console.log(`📝 Sections: ${Object.keys(entry.sections).join(', ') || 'none'}`);
    console.log('');

    // Print sections
    for (const [sectionName, sectionContent] of Object.entries(entry.sections)) {
      console.log(`  ### ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`);
      console.log('');
      // Indent content
      const lines = sectionContent.split('\n');
      lines.forEach(line => console.log(`  ${line}`));
      console.log('');
    }

    if (index < results.length - 1) {
      console.log('─'.repeat(80));
    }
  });

  // Output JSON at the end
  console.log('\n' + '═'.repeat(80));
  console.log('\n📋 JSON Output:\n');
  console.log(JSON.stringify(results, null, 2));

} catch (error) {
  console.error('❌ Error parsing changelog:', error.message);
  process.exit(1);
}
