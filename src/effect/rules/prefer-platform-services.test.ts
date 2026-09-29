import { RuleTester } from "oxlint/plugins-dev";

import { preferPlatformServicesRule } from "./prefer-platform-services.ts";

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

tester.run(
  "timmo-effect/prefer-platform-services",
  preferPlatformServicesRule,
  {
    valid: [
      `
      import { spawn } from "node:child_process";
      import { readFile } from "node:fs/promises";
      export const run = () => spawn("ls");
    `,
      `const child = Bun.spawn(["ls"]);`,
      `
      import { Effect, FileSystem } from "effect";
      import { ChildProcess } from "effect/process";
      export const read = Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        return yield* fs.readFileString("config.json");
      });
    `,
      `
      import type { Effect } from "effect";
      import { spawn } from "node:child_process";
    `,
      `
      import { Effect } from "effect";
      import type { Stats } from "node:fs";
      import { join } from "node:path";
    `,
      `
      import { Effect } from "effect";
      const Bun = { spawn: () => Effect.void };
      Bun.spawn();
    `,
    ],
    invalid: [
      {
        code: `
        import { Effect } from "effect";
        import { spawn } from "node:child_process";
      `,
        errors: [{ messageId: "childProcess" }],
        output: null,
      },
      {
        code: `
        import * as Effect from "effect/Effect";
        import { readFile } from "fs/promises";
        import { existsSync } from "node:fs";
      `,
        errors: [{ messageId: "fileSystem" }, { messageId: "fileSystem" }],
        output: null,
      },
      {
        code: `
        import { Effect } from "effect";
        export const run = Effect.promise(() => Bun.spawn(["ls"]).exited);
        export const read = Effect.promise(() => Bun.file("a.json").text());
      `,
        errors: [{ messageId: "childProcess" }, { messageId: "fileSystem" }],
        output: null,
      },
      {
        code: `
        import { NodeServices } from "@effect/platform-node";
        import { $, type ShellOutput } from "bun";
      `,
        errors: [{ messageId: "childProcess" }],
        output: null,
      },
    ],
  },
);
