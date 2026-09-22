# Oxlint Rules

Shared Oxlint plugins and configs built around the unchanged
[`dmmulroy/anti-slop`](https://github.com/dmmulroy/anti-slop) rules, with
locally owned generic rules under `timmo` and Effect rules under
`timmo-effect`.

This package targets the latest stable Oxlint toolchain. Oxlint's
[JavaScript plugin API is alpha](https://oxc.rs/docs/guide/usage/linter/config.html)
and is outside its semver guarantees, so each rules release declares the exact
`oxlint` and `@oxlint/plugins` versions it has validated. Older toolchains and
untested future versions are not part of the support contract.

## Install

Check the published rules package's `peerDependencies` against the official npm
`latest` versions of `oxlint` and `@oxlint/plugins`. If they differ, a validated
rules release is needed before upgrading. Do not bypass peer checks or override
Vite Plus's bundled dependencies to make an unsupported version fit.

Once the versions match, install from npm with the package manager already used
by the repository:

```sh
bun add --dev --exact @timmo001/oxlint-rules oxlint @oxlint/plugins
```

Extend the generic config:

```ts
import { defineConfig } from "oxlint";
import recommended from "@timmo001/oxlint-rules/configs/recommended";

export default defineConfig({
  extends: [recommended],
});
```

Effect repositories can use the opt-in config instead:

```ts
import { defineConfig } from "oxlint";
import recommendedEffect from "@timmo001/oxlint-rules/configs/recommended-effect";

export default defineConfig({
  extends: [recommendedEffect],
});
```

Both configs can be installed from JSR with its npm compatibility support.
npmjs.org remains the default for package managers that resolve ordinary
package names from `node_modules`.

For type-aware linting, also pin the latest `oxlint-tsgolint` version that meets
Oxlint's declared peer requirement and has passed the package check. Enable
`options: { typeAware: true }` in the consumer's config. The shared configs do
not enable type-aware linting themselves.

## Copy rules

Copy a reviewed snapshot when a repository should own the rule source:

```sh
npx --yes @timmo001/oxlint-rules copy tools/oxlint/timmo-rules
```

The command prints every copied plugin entry point and the rule settings from
the package configs to merge into the target Oxlint config. Effect settings
remain opt-in. It excludes tests and repository metadata, and refuses to
replace an existing destination unless `--force` is passed.

## Rules

### `anti-slop` and `anti-slop-effect`

See the upstream [rule documentation](https://github.com/dmmulroy/anti-slop#rules).

### `timmo`

- `prefer-event-parameter-type`: reports assertions on a handler parameter's
  `target` or `currentTarget`. Express the target type in the function signature
  instead so every use sees the same contract.

### `timmo-effect`

- `no-try-catch-in-effect-generators`: diagnoses synchronous `try/catch` owned
  by generators passed directly to `Effect.gen` or the curried `Effect.fn`
  form. It leaves ordinary async polling, nested callback boundaries,
  non-Effect generators, and `try/finally` cleanup alone. The rule is
  diagnostic-only because catch bodies cannot be rewritten safely in general.

## Development

Initialise the upstream source and run the package checks:

```sh
git submodule update --init --recursive
mise run check
mise run build
mise run test:package
npm pack --dry-run
bunx jsr@0.14.3 publish --dry-run --allow-dirty
```

`bun run lint` builds the local plugins before linting all maintained code,
including tests, tooling, the root config and packaged skill scripts. The root
config extends the local `recommended-effect` source config, enabling every
registered rule in `anti-slop`, `timmo`, `anti-slop-effect` and `timmo-effect`.
Plugin imports resolve through this package's exports to the fresh `dist` build.

Lint disables nested configs so the vendored submodule's config cannot override
the root exclusions. Generated output, vendored source and agent directories
remain excluded. RuleTester fixture strings retain their intentional violations;
the surrounding test code is linted with the full rule set.

`mise run test:package` builds and packs once, then installs the tarball in an
isolated consumer using the exact toolchain pins from `package.json` and strict
peer checks. It verifies both recommended configs, diagnostics from all four
shared namespaces, and valid and invalid type-aware examples. CI runs this
through the existing package workflow's build step. It also requires matching,
exact Oxlint development and peer versions.

### Toolchain updates and releases

Renovate's shared preset groups Oxlint, `@oxlint/plugins` and `oxlint-tsgolint`.
The local rule keeps both development and peer dependencies pinned instead of
widening peer ranges. For each update:

1. Verify the official npm `latest` versions and Oxlint's tsgolint peer
   requirement. Keep Oxlint and plugins on the same latest version and regenerate
   the lockfile with the selected tsgolint version.
2. Run the checks and package dry-runs above. Fix any API incompatibility before
   accepting the new pins; do not disable rules or bypass peer failures.
3. Review and merge the validated update. Consumers need a separately approved
   version bump and release to receive the new peer contract. Publishing a
   GitHub release triggers the existing npm and JSR workflows; both must succeed
   before the update is available to consumers.

Advance `vendor/anti-slop` only by updating its Git submodule commit. Keep its
source and MIT licence unchanged, then run the full package checks so both
upstream exports and composed configs are verified.
