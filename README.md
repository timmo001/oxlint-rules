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

## Skills

[`install-timmo-oxlint-rules`](skills/install-timmo-oxlint-rules/SKILL.md)
guides agents through installing or copying these rules:

```sh
npx skills add timmo001/oxlint-rules --skill install-timmo-oxlint-rules
```

[`add-oxlint-rule`](skills/add-oxlint-rule/SKILL.md) and
[`release-oxlint-rules`](skills/release-oxlint-rules/SKILL.md) are for
maintaining this package.

## Rules

### `anti-slop` and `anti-slop-effect`

See the upstream [rule documentation](https://github.com/dmmulroy/anti-slop#rules).
The recommended configs disable
`anti-slop/require-safety-comment-for-type-assertion` in favour of
`timmo/prefer-types-over-assertions`. The upstream rule remains available for
explicit use.

### Oxlint built-in rules

The recommended configs also enable `typescript/no-non-null-assertion`,
`typescript/no-unnecessary-type-arguments`,
`typescript/no-unnecessary-type-assertion`, and
`typescript/no-unnecessary-type-parameters`. The last three are type-aware, so
they only run when the consumer enables `typeAware`.

### `timmo`

- `no-explicit-inferable-type-predicate`: reports explicit `x is T` predicates on
  non-exported functions whose whole body is a null or `undefined` exclusion, a
  `typeof` comparison, or an `instanceof` check. TypeScript 5.5 and later infer
  those predicates, and an explicit predicate is never checked against the
  body. Methods, exported functions, and `asserts` predicates are left alone.
- `no-unchecked-query-selector-type`: reports type arguments on
  `querySelector`, `querySelectorAll`, and `closest`, which cast the result
  without checking it. Check the element with `instanceof`, use a checked lookup
  helper, or query a tag name so TypeScript infers the type. Static render-root
  queries in Lit elements are left to `prefer-lit-query-decorators`.
- `no-untyped-custom-event`: reports `CustomEvent` used as a type without a
  detail type, which leaves `detail` as `any`. Reuse the project's typed event
  helper or add one.
- `prefer-event-parameter-type`: reports assertions on a handler parameter's
  `target`, `currentTarget`, or `detail` (including nested `detail` members).
  Express the type in the function signature instead so every use sees the same
  contract.
- `prefer-lit-query-decorators`: follows eslint-plugin-lit's
  [`prefer-query-decorators`](https://github.com/43081j/eslint-plugin-lit/blob/master/docs/rules/prefer-query-decorators.md),
  including its options and `settings.lit.elementBaseClasses`. It also catches
  non-null, optional, and asserted render roots such as
  `this.shadowRoot!.querySelector(...)`, and resolves `this` so nested classes
  and plain functions are not reported. Only static selectors are reported,
  because a query decorator cannot express a selector built at runtime. Turn
  off `lit/prefer-query-decorators` when using this rule.
- `prefer-types-over-assertions`: reports non-`const` TypeScript assertions,
  even when preceded by a `SAFETY:` comment. Type values where they enter the
  code, for example in function parameters or a checked DOM lookup helper that
  returns `null` when the element is missing or has the wrong type. Assertions
  that `prefer-event-parameter-type` reports are skipped here.

### `timmo-effect`

- `no-raw-gh`: reports the raw `execute`, `json` and `stream` methods called on
  a `yield* Gh` binding from `@timmo001/effect-gh`, `Api.raw` from that package,
  and calls that launch gh: `"gh"` followed by its arguments, such as
  `executor.run("gh", ...)`, or an argument array starting with `"gh"` passed
  to a spawn, exec, run or command function, such as `Bun.spawn(["gh", ...])`.
  Use the package's typed operations, and add one to effect-gh when a command
  has none.
  effect-gh's own relative imports are not reported.
- `no-try-catch-in-effect-generators`: diagnoses synchronous `try/catch` owned
  by generators passed directly to `Effect.gen` or the curried `Effect.fn`
  form. It leaves ordinary async polling, nested callback boundaries,
  non-Effect generators, and `try/finally` cleanup alone. The rule is
  diagnostic-only because catch bodies cannot be rewritten safely in general.
- `prefer-platform-services`: in modules that import `effect`, `effect/*`, or
  `@effect/*`, reports Node `child_process` and `fs` imports and Bun's `spawn`,
  `spawnSync`, `$`, `file`, and `write`. Use `ChildProcessSpawner` from
  `effect/process` and the `FileSystem` service so cleanup, interruption, typed
  failures, and test layers apply. `fetch` is not reported.

## Development

Initialise the upstream source and run the package checks:

```sh
git submodule update --init --recursive
mise run check ::: build
mise run test:package
npm pack --dry-run
bunx jsr@0.14.3 publish --dry-run --allow-dirty
```

`bun run lint` builds the local plugins before linting all maintained code,
including tests, tooling, the root config and packaged skill scripts. The root
config extends the local `recommended-effect` source config, enabling registered
rules in `anti-slop`, `timmo`, `anti-slop-effect` and `timmo-effect` except for
the upstream safety-comment requirement described above.
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
