/**
 * Parse a Keep a Changelog formatted changelog file.
 *
 * @param {string} changelogContent - The raw markdown content of the changelog
 * @param {string|null} version - Specific version to extract (e.g., "v1.14.0" or "1.14.0"), or "latest" for most recent
 * @returns {Array<{name: string, sections: Object, contents: string}>} Array of version objects
 */
function parseChangelog(changelogContent, version = 'latest') {
  const versions = [];
  const lines = changelogContent.split('\n');

  let currentVersion = null;
  let currentSection = null;
  let currentSectionContent = [];

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
      continue;
    }

    // Check for section header
    const sectionMatch = line.match(sectionRegex);
    if (sectionMatch && currentVersion) {
      // Save previous section if exists
      saveCurrentSection();

      // Start new section
      currentSection = sectionMatch[1].toLowerCase();
      currentSectionContent = [];
      continue;
    }

    // Add content to current section
    if (currentVersion && currentSection) {
      currentSectionContent.push(line);
    }
  }

  // Save final version and section
  if (currentVersion) {
    saveCurrentSection();
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

  // Build contents for each version (all sections combined)
  for (const ver of versions) {
    const contentParts = [];

    // Order sections in conventional order
    const sectionOrder = ['added', 'changed', 'deprecated', 'removed', 'fixed', 'security'];

    for (const sectionName of sectionOrder) {
      if (ver.sections[sectionName]) {
        contentParts.push(`### ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}\n\n${ver.sections[sectionName]}`);
      }
    }

    // Add any sections not in the standard order
    for (const [sectionName, sectionContent] of Object.entries(ver.sections)) {
      if (!sectionOrder.includes(sectionName)) {
        contentParts.push(`### ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}\n\n${sectionContent}`);
      }
    }

    ver.contents = contentParts.join('\n\n');
  }

  // Filter by version if specified
  if (version && version !== 'latest') {
    const normalizedVersion = version.replace(/^v/, ''); // Remove 'v' prefix if present
    const filtered = versions.filter(v => v.name === normalizedVersion);
    return filtered;
  }

  // Return latest version if requested
  if (version === 'latest' && versions.length > 0) {
    return [versions[0]];
  }

  return versions;
}

module.exports = { parseChangelog };
