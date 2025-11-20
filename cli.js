#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseChangelog } = require('./src/parser');

/**
 * CLI for testing the changelog parser
 * Usage: node cli.js [changelog-file] [version]
 */

function printUsage() {
  console.log(`
Usage: node cli.js [changelog-file] [version]

Arguments:
  changelog-file  Path to changelog file (default: CHANGELOG.md)
  version        Version to extract (default: latest)
                 Can be: "latest", "1.14.0", "v1.14.0", or null for all versions

Examples:
  node cli.js                           # Parse CHANGELOG.md, extract latest
  node cli.js CHANGELOG.md latest       # Same as above
  node cli.js CHANGELOG.md 1.14.0       # Extract specific version
  node cli.js CHANGELOG.md all          # Extract all versions
  node cli.js /tmp/test-changelog.md    # Parse specific file
`);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printUsage();
  process.exit(0);
}

const changelogFile = args[0] || 'CHANGELOG.md';
const versionArg = args[1] || 'latest';
const version = versionArg === 'all' ? null : versionArg;

// Read changelog file
const changelogPath = path.resolve(process.cwd(), changelogFile);

if (!fs.existsSync(changelogPath)) {
  console.error(`❌ Error: Changelog file not found: ${changelogPath}`);
  console.error('\nTip: You can create a test changelog at /tmp/test-changelog.md');
  process.exit(1);
}

const changelogContent = fs.readFileSync(changelogPath, 'utf8');

// Parse changelog
console.log(`📖 Parsing: ${changelogPath}`);
console.log(`🎯 Version: ${versionArg}`);
console.log('');

try {
  const results = parseChangelog(changelogContent, version);

  if (results.length === 0) {
    console.log('⚠️  No changelog entries found');
    process.exit(0);
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
