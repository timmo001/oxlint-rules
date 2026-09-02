# Repository guidance

- `vendor/anti-slop` is an unchanged upstream Git submodule. Never patch files
  inside it.
- Keep locally owned rules under `src/` and preserve the `anti-slop`,
  `anti-slop-effect`, and `timmo-effect` namespaces.
- Use Oxlint's ESTree API and add focused `RuleTester` fixtures for every rule change.
- Keep package exports, copied rule entry points, config registration, and the
  README rule list in sync.
- Keep package, CLI, README, and skill content portable. Do not add personal
  filesystem paths or private configuration.
- Run `mise run check`, `mise run build`, `npm pack --dry-run`, and
  `bunx jsr@0.14.3 publish --dry-run` before requesting a release.
