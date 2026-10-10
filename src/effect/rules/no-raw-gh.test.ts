import { RuleTester } from "oxlint/plugins-dev";

import { noRawGhRule } from "./no-raw-gh.ts";

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

tester.run("timmo-effect/no-raw-gh", noRawGhRule, {
  valid: [
    `
      import { Api, PullRequest } from "@timmo001/effect-gh";
      import { Effect, Schema } from "effect";
      export const run = Effect.gen(function* () {
        yield* PullRequest.get({ fields: ["number"] });
        yield* Api.json({ endpoint: "user", method: "GET" }, Schema.Unknown);
      });
    `,
    `
      import { Gh } from "./gh.js";
      import { Effect } from "effect";
      export const run = Effect.gen(function* () {
        const gh = yield* Gh;
        return yield* gh.execute(["pr", "list"]);
      });
    `,
    `
      import { Effect } from "effect";
      export const run = (executor) => executor.exitCode("which", ["gh"]);
      const error = { command: "gh" };
      const files = { json: (path) => path };
      files.json("package.json");
    `,
    `
      import { Gh } from "@timmo001/effect-gh";
      import { Effect } from "effect";
      export const run = Effect.gen(function* () {
        const gh = yield* Gh;
        return yield* gh.interactive(["repo", "clone", "owner/repo", "dir"]);
      });
    `,
  ],
  invalid: [
    {
      code: `
        import { Gh } from "@timmo001/effect-gh";
        import { Effect, Schema } from "effect";
        export const run = Effect.gen(function* () {
          const gh = yield* Gh;
          yield* gh.execute(["pr", "list"]);
          yield* gh.json(["api", "user"], Schema.Unknown);
          yield* (yield* Gh).stream(["run", "watch"]);
        });
      `,
      errors: [
        { messageId: "rawGh" },
        { messageId: "rawGh" },
        { messageId: "rawGh" },
      ],
      output: null,
    },
    {
      code: `
        import { Api } from "@timmo001/effect-gh";
        export const run = Api.raw({ endpoint: "user", method: "GET" });
      `,
      errors: [{ messageId: "rawApi" }],
      output: null,
    },
    {
      code: `
        import { Effect } from "effect";
        export const run = (executor) =>
          Effect.all([
            executor.run("gh", ["api", "user"]),
            executor.inherit("gh", ["repo", "clone", "a", "b"]),
          ]);
        Bun.spawnSync(["gh", "auth", "status"]);
      `,
      errors: [
        { messageId: "spawnGh" },
        { messageId: "spawnGh" },
        { messageId: "spawnGh" },
      ],
      output: null,
    },
  ],
});
