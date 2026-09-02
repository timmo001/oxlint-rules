---
name: install-timmo-oxlint-rules
description: >-
  Install @timmo001/oxlint-rules in a JavaScript or TypeScript repository. Use
  when adding the shared Oxlint config, enabling its Effect rules, or replacing
  repository-local Oxlint rules.
---

# Install Timmo Oxlint Rules

1. Inspect the target's manifests, lockfiles, Oxlint config, repository
   instructions, and normal checks. Use the current working directory unless
   the user names another target.
2. Preserve existing ignores, overrides, plugins, and repository-owned rules.
   Confirm `oxlint` and `@oxlint/plugins` use the same exact version supported
   by the package version.
3. Ask whether to install from npmjs.org or JSR.
4. Detect Bun, npm, pnpm, or Yarn from the target's package manager declaration
   and lockfile. Add an exact development dependency through that package
   manager.
5. Extend `@timmo001/oxlint-rules/configs/recommended`. Use `/configs/effect`
   instead only when `effect` is a direct dependency or the user explicitly
   requests it.
6. Keep dependency and config edits visible. Do not delegate them to a script.

Run the target repository's normal lint, typecheck, tests, and build. Report
package-manager changes, preserved local configuration, enabled rule groups,
and checks.
