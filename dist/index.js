/**
 * Parse a Keep a Changelog formatted changelog file.
 *
 * @param {string} changelogContent - The raw markdown content of the changelog
 * @param {string|null} version - Specific version to extract (e.g., "v1.14.0" or "1.14.0"), or null/undefined for all versions
 * @returns {Array<{name: string, sections: Object, contents: string}>} Array of version objects
 */
function parseChangelog(changelogContent, version = null) {
  const versions = [];
  const lines = changelogContent.split('\n');

  let currentVersion = null;
  let currentSection = null;
  let currentSectionContent = [];
  let generalContent = []; // Content without section headers

  // Regex to match version headers: ## v1.14.0 or ## v1.14.0 - 2024-04-29
  const versionRegex = /^##\s+v?(\d+\.\d+\.\d+(?:-[^\s]+)?)\s*(?:-\s*(.*))?$/;
  // Regex to match section headers: ### Added, ### Changed, etc.
  const sectionRegex = /^###\s+(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for version header
    const versionMatch = line.match(versionRegex);
    if (versionMatch) {
      // Save previous version if exists
      if (currentVersion) {
        saveCurrentSection();
        saveGeneralContent();
        versions.push(currentVersion);
      }

      // Start new version
      currentVersion = {
        name: versionMatch[1], // Version without 'v' prefix
        sections: {},
        contents: ''
      };
      currentSection = null;
      currentSectionContent = [];
      generalContent = [];
      continue;
    }

    // Check for section header
    const sectionMatch = line.match(sectionRegex);
    if (sectionMatch && currentVersion) {
      // If we have general content, save it before starting a new section
      if (generalContent.length > 0) {
        saveGeneralContent();
      }

      // Save previous section if exists
      saveCurrentSection();

      // Start new section
      currentSection = sectionMatch[1].toLowerCase();
      currentSectionContent = [];
      continue;
    }

    // Add content to current section or general content
    if (currentVersion) {
      if (currentSection) {
        currentSectionContent.push(line);
      } else {
        // Content without a section header goes to general
        generalContent.push(line);
      }
    }
  }

  // Save final version and section
  if (currentVersion) {
    saveCurrentSection();
    saveGeneralContent();
    versions.push(currentVersion);
  }

  // Helper function to save the current section
  function saveCurrentSection() {
    if (currentVersion && currentSection && currentSectionContent.length > 0) {
      // Trim empty lines from start and end
      while (currentSectionContent.length > 0 && currentSectionContent[0].trim() === '') {
        currentSectionContent.shift();
      }
      while (currentSectionContent.length > 0 && currentSectionContent[currentSectionContent.length - 1].trim() === '') {
        currentSectionContent.pop();
      }

      const content = currentSectionContent.join('\n');
      if (content.trim()) {
        currentVersion.sections[currentSection] = content;
      }
    }
  }

  // Helper function to save general content (content without section headers)
  function saveGeneralContent() {
    if (currentVersion && generalContent.length > 0) {
      // Trim empty lines from start and end
      let trimmedContent = [...generalContent];
      while (trimmedContent.length > 0 && trimmedContent[0].trim() === '') {
        trimmedContent.shift();
      }
      while (trimmedContent.length > 0 && trimmedContent[trimmedContent.length - 1].trim() === '') {
        trimmedContent.pop();
      }

      const content = trimmedContent.join('\n');
      if (content.trim()) {
        currentVersion.sections['general'] = content;
      }
      generalContent = [];
    }
  }

  // Build contents for each version (all sections combined)
  for (const ver of versions) {
    const contentParts = [];

    // Order sections in conventional order, with general at the end
    const sectionOrder = ['added', 'changed', 'deprecated', 'removed', 'fixed', 'security'];

    for (const sectionName of sectionOrder) {
      if (ver.sections[sectionName]) {
        contentParts.push(`### ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}\n\n${ver.sections[sectionName]}`);
      }
    }

    // Add any sections not in the standard order (except 'general')
    for (const [sectionName, sectionContent] of Object.entries(ver.sections)) {
      if (!sectionOrder.includes(sectionName) && sectionName !== 'general') {
        contentParts.push(`### ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}\n\n${sectionContent}`);
      }
    }

    // Add general section last if it exists (without a header since it's raw content)
    if (ver.sections['general']) {
      contentParts.push(ver.sections['general']);
    }

    ver.contents = contentParts.join('\n\n');
  }

  // Filter by specific version if requested
  if (version) {
    const normalizedVersion = version.replace(/^v/, ''); // Remove 'v' prefix if present
    const filtered = versions.filter(v => v.name === normalizedVersion);
    return filtered;
  }

  // Return all versions by default
  return versions;
}




const fs = require('fs');
const path = require('path');


/**
 * Main action entry point
 *
 * @param {import('@actions/core')} core
 */
async function run(core) {
  try {
    // Get inputs
    const changelogPath = core.getInput('changelog-path') || 'CHANGELOG.md';
    const versionInput = core.getInput('version');

    // Only pass version if explicitly specified, otherwise return all versions
    const version = versionInput || null;

    // Read changelog file
    const fullPath = path.resolve(process.cwd(), changelogPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Changelog file not found: ${fullPath}`);
    }

    const changelogContent = fs.readFileSync(fullPath, 'utf8');

    // Parse changelog
    const results = parseChangelog(changelogContent, version);

    if (results.length === 0) {
      core.warning(`No changelog entries found${version ? ` for version ${version}` : ''}`);
    }

    // Set output as JSON string
    core.setOutput('result', JSON.stringify(results));

    // Log summary
    core.info(`Parsed ${results.length} changelog ${results.length === 1 ? 'entry' : 'entries'}`);
    for (const entry of results) {
      core.info(`  - Version ${entry.name}: ${Object.keys(entry.sections).length} sections`);
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

// Only run if this is the main module (for GitHub Actions)
if (require.main === module) {
  const core = require('@actions/core');
  run(core);
}

module.exports = run;