# Oxlint Rules

Shared Oxlint plugins and configs built around the unchanged
[`dmmulroy/anti-slop`](https://github.com/dmmulroy/anti-slop) rules, with
separately owned Effect rules under the `timmo-effect` namespace.

Oxlint's JavaScript plugin API is alpha. Consumers must keep `oxlint` and
`@oxlint/plugins` on the exact peer versions declared by this package.

## Install

Install from npm with the package manager already used by the repository:

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
import effect from "@timmo001/oxlint-rules/configs/effect";

export default defineConfig({
  extends: [effect],
});
```

Both configs can be installed from JSR with its npm compatibility support.
npmjs.org remains the default for package managers that resolve ordinary
package names from `node_modules`.

## Copy rules

Copy a reviewed snapshot when a repository should own the rule source:

```sh
npx --yes @timmo001/oxlint-rules copy tools/oxlint/timmo-rules
```

The command prints the three local plugin entry points. It excludes tests and
repository metadata, and refuses to replace an existing destination unless
`--force` is passed.

## Rules

### `anti-slop`

- `no-chained-type-assertions`
- `no-conditional-empty-object-spread`
- `no-known-value-widening`
- `no-module-mocking`
- `no-object-parameters`
- `no-reflect-apply`
- `no-reflect-get`
- `no-runtime-typeof`
- `no-shape-in-symbol-names`
- `no-unknown-parameters`
- `no-unknown-returns`
- `no-unknown-type-aliases`
- `no-unsafe-dictionary-type`
- `no-widen-then-assert`
- `require-safety-comment-for-type-assertion`

### `anti-slop-effect`

- `no-service-constructor-imports`

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
npm pack --dry-run
bunx jsr publish --dry-run
```

Advance `vendor/anti-slop` only by updating its Git submodule commit. Keep its
source and MIT licence unchanged, then run the full package checks so both
upstream exports and composed configs are verified.
