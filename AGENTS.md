# Repository guidance

- `vendor/anti-slop` is an unchanged upstream Git submodule. Never patch files
  inside it.
- Keep locally owned rules under `src/` and preserve the `anti-slop`, `timmo`,
  `anti-slop-effect`, and `timmo-effect` namespaces.
- Use Oxlint's ESTree API and add focused `RuleTester` fixtures for every rule change.
- Register every rule in its plugin. Package configs and the copy command derive
  enabled settings from each plugin's `rules` map; keep package exports, copied
  entry points, and the README rule list in sync.
- Keep package, CLI, README, and skill content portable. Do not add personal
  filesystem paths or private configuration.
- Apply the `release-oxlint-rules` skill for major, minor, patch, or exact
  version release requests.
- Run `mise run check`, `mise run build`, `npm pack --dry-run`, and
  `bunx jsr@0.14.3 publish --dry-run` before requesting a release. Add
  `--allow-dirty` to the JSR command when validating intended uncommitted
  changes.
