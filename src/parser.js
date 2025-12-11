/**
 * Unwrap text that has been wrapped across multiple lines.
 * This fixes changelog text that has been hard-wrapped for readability
 * but should flow as continuous text.
 *
 * @param {string} text - The text content to unwrap
 * @returns {string} The unwrapped text
 */
function unwrapText(text) {
  const lines = text.split('\n')
  const unwrappedLines = []

  for (let i = 0; i < lines.length; i++) {
    let currentLine = lines[i]

    // Skip empty lines - preserve them as-is
    if (currentLine.trim() === '') {
      unwrappedLines.push(currentLine)
      continue
    }

    // Collect continuation lines
    let j = i + 1
    while (j < lines.length) {
      const nextLine = lines[j]

      // Stop if next line is empty
      if (nextLine.trim() === '') {
        break
      }

      const trimmedCurrent = currentLine.trim()
      const trimmedNext = nextLine.trim()

      // Don't unwrap if current line looks like it ends a sentence/item
      const endsWithPunctuation = /[.!?:;]$/.test(trimmedCurrent)
      const endsWithCode = /`$/.test(trimmedCurrent)
      const endsWithBullet = /[-*+]\s*$/.test(trimmedCurrent)

      // Don't unwrap if next line starts a new bullet point, section, or sentence
      const startsWithBullet = /^[-*+]\s/.test(trimmedNext)
      const startsWithNumber = /^\d+\.\s/.test(trimmedNext)
      const startsWithMarkdown = /^[#>]/.test(trimmedNext)

      // More nuanced check for new sentences
      const prevEndsWithContinuation =
        /[,&]$/.test(trimmedCurrent) ||
        /\b(and|or|but|with|for|to|from|in|on|at|by)$/.test(trimmedCurrent)
      const startsWithCapitalNewSentence =
        /^[A-Z]/.test(trimmedNext) &&
        !prevEndsWithContinuation &&
        endsWithPunctuation

      // Determine if we should unwrap this line with the next
      const shouldUnwrap =
        !endsWithPunctuation &&
        !endsWithCode &&
        !endsWithBullet &&
        !startsWithBullet &&
        !startsWithNumber &&
        !startsWithCapitalNewSentence &&
        !startsWithMarkdown

      if (shouldUnwrap) {
        // Join the lines, preserving the original indentation of the first line
        // but removing indentation from continuation lines
        currentLine = currentLine + ' ' + trimmedNext
        j++ // Move to next line
      } else {
        break // Stop unwrapping
      }
    }

    unwrappedLines.push(currentLine)
    i = j - 1 // Skip the lines we've consumed (j-1 because for loop will increment)
  }

  return unwrappedLines.join('\n')
}

/**
 * Parse a Keep a Changelog formatted changelog file.
 *
 * @param {string} changelogContent - The raw markdown content of the changelog
 * @param {string|null} version - Specific version to extract (e.g., "v1.14.0" or "1.14.0"), or null/undefined for all versions
 * @returns {Array<{name: string, sections: Object, contents: string}>} Array of version objects
 */
export function parseChangelog(changelogContent, version = null) {
  const versions = []
  const lines = changelogContent.split('\n')

  let currentVersion = null
  let currentSection = null
  let currentSectionContent = []
  let generalContent = [] // Content without section headers

  // Regex to match version headers: ## v1.14.0 or ## v1.14.0 - 2024-04-29
  const versionRegex = /^##\s+v?(\d+\.\d+\.\d+(?:-[^\s]+)?)\s*(?:-\s*(.*))?$/
  // Regex to match section headers: ### Added, ### Changed, etc.
  const sectionRegex = /^###\s+(.+)$/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check for version header
    const versionMatch = line.match(versionRegex)
    if (versionMatch) {
      // Save previous version if exists
      if (currentVersion) {
        saveCurrentSection()
        saveGeneralContent()
        versions.push(currentVersion)
      }

      // Start new version
      currentVersion = {
        name: versionMatch[1], // Version without 'v' prefix
        sections: {},
        contents: ''
      }
      currentSection = null
      currentSectionContent = []
      generalContent = []
      continue
    }

    // Check for section header
    const sectionMatch = line.match(sectionRegex)
    if (sectionMatch && currentVersion) {
      // If we have general content, save it before starting a new section
      if (generalContent.length > 0) {
        saveGeneralContent()
      }

      // Save previous section if exists
      saveCurrentSection()

      // Start new section
      currentSection = sectionMatch[1].toLowerCase()
      currentSectionContent = []
      continue
    }

    // Add content to current section or general content
    if (currentVersion) {
      if (currentSection) {
        currentSectionContent.push(line)
      } else {
        // Content without a section header goes to general
        generalContent.push(line)
      }
    }
  }

  // Save final version and section
  if (currentVersion) {
    saveCurrentSection()
    saveGeneralContent()
    versions.push(currentVersion)
  }

  // Helper function to save the current section
  function saveCurrentSection() {
    if (currentVersion && currentSection && currentSectionContent.length > 0) {
      // Trim empty lines from start and end
      while (
        currentSectionContent.length > 0 &&
        currentSectionContent[0].trim() === ''
      ) {
        currentSectionContent.shift()
      }
      while (
        currentSectionContent.length > 0 &&
        currentSectionContent[currentSectionContent.length - 1].trim() === ''
      ) {
        currentSectionContent.pop()
      }

      const content = currentSectionContent.join('\n')
      if (content.trim()) {
        // Unwrap any text that has been hard-wrapped across lines
        const unwrappedContent = unwrapText(content)
        currentVersion.sections[currentSection] = unwrappedContent
      }
    }
  }

  // Helper function to save general content (content without section headers)
  function saveGeneralContent() {
    if (currentVersion && generalContent.length > 0) {
      // Trim empty lines from start and end
      let trimmedContent = [...generalContent]
      while (trimmedContent.length > 0 && trimmedContent[0].trim() === '') {
        trimmedContent.shift()
      }
      while (
        trimmedContent.length > 0 &&
        trimmedContent[trimmedContent.length - 1].trim() === ''
      ) {
        trimmedContent.pop()
      }

      const content = trimmedContent.join('\n')
      if (content.trim()) {
        // Unwrap any text that has been hard-wrapped across lines
        const unwrappedContent = unwrapText(content)
        currentVersion.sections['general'] = unwrappedContent
      }
      generalContent = []
    }
  }

  // Build contents for each version (all sections combined)
  for (const ver of versions) {
    const contentParts = []

    // Order sections in conventional order, with general at the end
    const sectionOrder = [
      'added',
      'changed',
      'deprecated',
      'removed',
      'fixed',
      'security'
    ]

    for (const sectionName of sectionOrder) {
      if (ver.sections[sectionName]) {
        contentParts.push(
          `### ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}\n\n${ver.sections[sectionName]}`
        )
      }
    }

    // Add any sections not in the standard order (except 'general')
    for (const [sectionName, sectionContent] of Object.entries(ver.sections)) {
      if (!sectionOrder.includes(sectionName) && sectionName !== 'general') {
        contentParts.push(
          `### ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}\n\n${sectionContent}`
        )
      }
    }

    // Add general section last if it exists (without a header since it's raw content)
    if (ver.sections['general']) {
      contentParts.push(ver.sections['general'])
    }

    ver.contents = contentParts.join('\n\n')
  }

  // Filter by specific version if requested
  if (version) {
    const normalizedVersion = version.replace(/^v/, '') // Remove 'v' prefix if present
    const filtered = versions.filter((v) => v.name === normalizedVersion)
    return filtered
  }

  // Return all versions by default
  return versions
}
