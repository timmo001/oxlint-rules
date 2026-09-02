import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";

import { copyRules } from "./copy.ts";

const temporaryDirectories: string[] = [];
const sourceRoot = resolve(import.meta.dirname, "../..");

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

async function temporaryDirectory() {
  const directory = await mkdtemp(join(tmpdir(), "oxlint-rules-"));
  temporaryDirectories.push(directory);
  return directory;
}

describe("copyRules", () => {
  test("the CLI uses a repository-relative default destination", async () => {
    const directory = await temporaryDirectory();
    const child = Bun.spawn(
      [process.execPath, join(sourceRoot, "src/cli.ts"), "copy"],
      { cwd: directory, stderr: "pipe", stdout: "pipe" },
    );

    expect(await child.exited).toBe(0);
    const output = await new Response(child.stdout).text();
    expect(output).toContain("./tools/oxlint/timmo-rules/effect/index.ts");
    expect(output).toContain(
      '"anti-slop/require-safety-comment-for-type-assertion": "error"',
    );
    expect(output).toContain(
      '"timmo-effect/no-try-catch-in-effect-generators": "error"',
    );
    expect(
      Bun.file(join(directory, "tools/oxlint/timmo-rules/effect/index.ts"))
        .size,
    ).toBeGreaterThan(0);
  });

  test("copies all plugin entry points without tests or repository metadata", async () => {
    const directory = await temporaryDirectory();
    const destination = join(directory, "rules");
    const entries = await copyRules(destination, { sourceRoot });

    expect(
      await readFile(join(destination, "upstream/anti-slop/index.ts"), "utf8"),
    ).toContain('meta: { name: "anti-slop" }');
    expect(
      await readFile(join(destination, "upstream/effect/index.ts"), "utf8"),
    ).toContain('meta: { name: "anti-slop-effect" }');
    expect(
      await readFile(join(destination, "effect/index.ts"), "utf8"),
    ).toContain('meta: { name: "timmo-effect" }');
    expect(
      await readFile(join(destination, "upstream/anti-slop/LICENSE"), "utf8"),
    ).toBe(
      await readFile(join(sourceRoot, "vendor/anti-slop/LICENSE"), "utf8"),
    );
    expect(
      Bun.file(
        join(
          destination,
          "effect/rules/no-try-catch-in-effect-generators.test.ts",
        ),
      ).size,
    ).toBe(0);
    expect(Bun.file(join(destination, "upstream/anti-slop/.git")).size).toBe(0);
    expect(entries.antiSlop).toEndWith("/rules/upstream/anti-slop/index.ts");
  });

  test("refuses an existing destination unless force is set", async () => {
    const directory = await temporaryDirectory();
    const destination = join(directory, "rules");
    await copyRules(destination, { sourceRoot });
    await expect(copyRules(destination, { sourceRoot })).rejects.toThrow(
      "Destination already exists",
    );

    await writeFile(join(destination, "stale.ts"), "stale");
    await copyRules(destination, { force: true, sourceRoot });
    expect(Bun.file(join(destination, "stale.ts")).size).toBe(0);
  });
});
