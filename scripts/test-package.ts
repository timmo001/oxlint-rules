import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import packageJson from "../package.json" with { type: "json" };

for (const dependency of [
  "oxlint",
  "@oxlint/plugins",
  "oxlint-tsgolint",
] as const) {
  assert.match(packageJson.devDependencies[dependency], /^\d+\.\d+\.\d+$/u);
}

for (const peer of ["oxlint", "@oxlint/plugins"] as const) {
  assert.equal(
    packageJson.peerDependencies[peer],
    packageJson.devDependencies[peer],
  );
}

assert.equal(
  packageJson.devDependencies.oxlint,
  packageJson.devDependencies["@oxlint/plugins"],
);

function run(cwd: string, command: string, args: string[], status = 0) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });

  if (result.error) throw result.error;

  assert.equal(
    result.status,
    status,
    `${command} ${args.join(" ")} in ${cwd}\n${result.stdout}\n${result.stderr}`,
  );

  return result.stdout;
}

run(process.cwd(), "bun", ["run", "build"]);

const directory = await mkdtemp(join(tmpdir(), "oxlint-rules-package-"));

try {
  run(process.cwd(), "npm", ["pack", "--pack-destination", directory]);

  const archives = await readdir(directory);
  assert.equal(archives.length, 1);
  const [archive] = archives;
  assert.ok(archive?.endsWith(".tgz"));

  const consumer = join(directory, "consumer");
  await mkdir(consumer);
  await writeFile(
    join(consumer, "package.json"),
    JSON.stringify({
      name: "oxlint-rules-package-consumer",
      private: true,
      type: "module",
      devDependencies: {
        "@timmo001/oxlint-rules": `file:${join(directory, archive)}`,
        oxlint: packageJson.devDependencies.oxlint,
        "@oxlint/plugins": packageJson.devDependencies["@oxlint/plugins"],
        "oxlint-tsgolint": packageJson.devDependencies["oxlint-tsgolint"],
      },
    }),
  );
  run(consumer, "npm", [
    "install",
    "--strict-peer-deps",
    "--legacy-peer-deps=false",
    "--force=false",
    "--no-audit",
    "--no-fund",
  ]);
  run(consumer, "npm", ["ls", "--all"]);

  const binary = join(consumer, "node_modules/oxlint/bin/oxlint");
  assert.equal(
    run(consumer, "node", [binary, "--version"]).trim(),
    `Version: ${packageJson.devDependencies.oxlint}`,
  );

  await writeFile(
    join(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: { strict: true, target: "ES2022", module: "NodeNext" },
      include: ["generic.ts", "type-aware.ts", "valid.ts"],
    }),
  );
  await writeFile(join(consumer, "valid.ts"), "void Promise.resolve(1);\n");
  await writeFile(join(consumer, "type-aware.ts"), "Promise.resolve(1);\n");
  await writeFile(
    join(consumer, "generic.ts"),
    `export const values = [1, 2].filter(value => value > 1).map(value => value * 2);

export function handle(event: Event) {
  return (event.currentTarget as HTMLInputElement).value;
}
`,
  );
  await writeFile(
    join(consumer, "effect.ts"),
    `import { Effect } from "effect";

export const ready = { _tag: "Ready" };

export const task = Effect.gen(function* () {
  try { return JSON.parse("{}"); } catch { return null; }
});
`,
  );

  for (const config of ["recommended", "recommended-effect"]) {
    await writeFile(
      join(consumer, "oxlint.config.ts"),
      `import recommended from "@timmo001/oxlint-rules/configs/${config}";
export default { extends: [recommended] };
`,
    );

    const args = [
      binary,
      "--disable-nested-config",
      "--deny-warnings",
      "--format",
      "json",
    ];

    run(consumer, "node", [...args, "valid.ts"]);
    const generic = run(consumer, "node", [...args, "generic.ts"], 1);
    assert.match(generic, /anti-slop\(no-array-filter-map\)/u);
    assert.match(generic, /timmo\(prefer-event-parameter-type\)/u);

    if (config === "recommended-effect") {
      const effect = run(consumer, "node", [...args, "effect.ts"], 1);
      assert.match(
        effect,
        /anti-slop-effect\(no-manual-tagged-construction\)/u,
      );
      assert.match(
        effect,
        /timmo-effect\(no-try-catch-in-effect-generators\)/u,
      );
    }

    const typedArgs = [
      ...args,
      "--type-aware",
      "--deny",
      "typescript/no-floating-promises",
    ];

    run(consumer, "node", [...typedArgs, "valid.ts"]);

    const typed = run(
      consumer,
      "node",
      [...typedArgs, "generic.ts", "type-aware.ts"],
      1,
    );

    assert.match(typed, /typescript\(no-floating-promises\)/u);
    assert.match(typed, /anti-slop\(no-array-filter-map\)/u);
    assert.match(typed, /timmo\(prefer-event-parameter-type\)/u);
    console.log(
      `PASS ${config}: packed plugins, shared diagnostics and type-aware linting`,
    );
  }

  console.log(
    `Validated oxlint ${packageJson.devDependencies.oxlint}, ` +
      `@oxlint/plugins ${packageJson.devDependencies["@oxlint/plugins"]}, ` +
      `oxlint-tsgolint ${packageJson.devDependencies["oxlint-tsgolint"]}`,
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
