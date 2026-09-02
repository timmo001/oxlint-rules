import { globSync } from "node:fs";
import { spawnSync } from "node:child_process";

for (const test of globSync("src/**/*.test.ts").sort()) {
  const command = /[\\/]rules[\\/]/u.test(test)
    ? ["node", "--experimental-strip-types", test]
    : ["bun", "test", test];
  const result = spawnSync(command[0], command.slice(1), { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
