import * as core from '@actions/core'
import fs from 'fs'
import path from 'path'
import { parseChangelog } from './parser.js'

/**
 * Main action entry point
 */
export async function run() {
  try {
    const changelogPath = core.getInput('changelog-path') || 'CHANGELOG.md'
    const versionInput = core.getInput('version')

    // Only pass version if explicitly specified, otherwise return all versions
    const version = versionInput || null

    // Read changelog file
    const fullPath = path.resolve(process.cwd(), changelogPath)

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Changelog file not found: ${fullPath}`)
    }

    const changelogContent = fs.readFileSync(fullPath, 'utf8')

    // Parse changelog
    const results = parseChangelog(changelogContent, version)

    if (results.length === 0) {
      core.warning(
        `No changelog entries found${version ? ` for version ${version}` : ''}`
      )
    }

    // Set output as JSON string
    core.setOutput('result', JSON.stringify(results))

    // Log summary
    core.info(
      `Parsed ${results.length} changelog ${results.length === 1 ? 'entry' : 'entries'}`
    )
    for (const entry of results) {
      core.info(
        `  - Version ${entry.name}: ${Object.keys(entry.sections).length} sections`
      )
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
