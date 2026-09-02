import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_COPY_DESTINATION = "tools/oxlint/timmo-rules";

export interface CopyRulesOptions {
  readonly force?: boolean;
  readonly sourceRoot?: string;
}

export interface CopiedRuleEntryPoints {
  readonly antiSlop: string;
  readonly antiSlopEffect: string;
  readonly timmoEffect: string;
}

function packageRoot() {
  const current = dirname(fileURLToPath(import.meta.url));
  return current.endsWith(join("src", "install"))
    ? resolve(current, "../..")
    : resolve(current, "..");
}

async function copyTree(source: string, destination: string) {
  await cp(source, destination, {
    recursive: true,
    filter: (path) =>
      !path.endsWith(".test.ts") && !path.includes(`${join("", ".git")}`),
  });
}

export async function copyRules(
  destination: string,
  options: CopyRulesOptions = {},
): Promise<CopiedRuleEntryPoints> {
  const target = resolve(destination);
  const entries = await readdir(dirname(target), { withFileTypes: true }).catch(
    () => [],
  );
  if (entries.some((entry) => entry.name === target.split(/[\\/]/u).at(-1))) {
    if (!options.force) {
      throw new Error(
        `Destination already exists: ${target}. Pass --force to replace it.`,
      );
    }
    await rm(target, { force: true, recursive: true });
  }

  const root = options.sourceRoot ?? packageRoot();
  await mkdir(join(target, "upstream"), { recursive: true });
  await copyTree(
    join(root, "vendor/anti-slop/src"),
    join(target, "upstream/anti-slop"),
  );
  await cp(
    join(root, "vendor/anti-slop/LICENSE"),
    join(target, "upstream/anti-slop/LICENSE"),
  );
  await rm(join(target, "upstream/anti-slop/effect"), {
    force: true,
    recursive: true,
  });
  await copyTree(
    join(root, "vendor/anti-slop/src/effect"),
    join(target, "upstream/effect"),
  );
  await copyTree(join(root, "src/effect"), join(target, "effect"));

  const displayRoot = relative(process.cwd(), target) || ".";
  const entryPoint = (path: string) => `./${path.split(sep).join("/")}`;
  return {
    antiSlop: entryPoint(join(displayRoot, "upstream/anti-slop/index.ts")),
    antiSlopEffect: entryPoint(join(displayRoot, "upstream/effect/index.ts")),
    timmoEffect: entryPoint(join(displayRoot, "effect/index.ts")),
  };
}
