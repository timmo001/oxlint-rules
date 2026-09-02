import { chmod, rm } from "node:fs/promises";

await rm("dist", { force: true, recursive: true });

const result = await Bun.build({
  entrypoints: [
    "src/cli.ts",
    "src/upstream/anti-slop.ts",
    "src/upstream/effect.ts",
    "src/effect/index.ts",
    "src/configs/recommended.ts",
    "src/configs/effect.ts",
  ],
  external: ["@oxlint/plugins"],
  format: "esm",
  naming: "[dir]/[name].js",
  outdir: "dist",
  root: "src",
  target: "node",
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exitCode = 1;
} else {
  await chmod("dist/cli.js", 0o755);
}
