# Publishing to NPM

This package is published to NPM as `@alleyinteractive/changelog-extractor`.

## Prerequisites

1. You need to be a member of the `@alleyinteractive` organization on NPM
2. You need to be logged in: `npm login`
3. Ensure all tests pass: `npm test`

## Publishing Steps

1. Update the version in `package.json`:

   ```bash
   npm version patch  # or minor, or major
   ```

2. Publish to NPM:

   ```bash
   npm publish --access public
   ```

3. Push the version tag to GitHub:
   ```bash
   git push --follow-tags
   ```

## After Publishing

Users can then use the package via:

```bash
# Run with npx (no installation)
npx @alleyinteractive/changelog-extractor

# Or install globally
npm install -g @alleyinteractive/changelog-extractor
changelog-extractor
```

## GitHub Action

The GitHub Action in this repository will continue to work alongside the NPM
package. The action uses the parser from `src/parser.js` directly.
