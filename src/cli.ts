#!/usr/bin/env node
import { resolve } from "node:path";

import effect from "./configs/effect.ts";
import recommended from "./configs/recommended.ts";
import { copyRules, DEFAULT_COPY_DESTINATION } from "./install/copy.ts";

function usage() {
  return "Usage: oxlint-rules copy [destination] [--force]";
}

function printRuleSettings(
  heading: string,
  settings: Readonly<Record<string, unknown>>,
) {
  console.log(heading);
  for (const [rule, severity] of Object.entries(settings)) {
    console.log(`  ${JSON.stringify(rule)}: ${JSON.stringify(severity)},`);
  }
}

const [command, ...arguments_] = process.argv.slice(2);
if (command === "--help" || command === "-h") {
  console.log(usage());
} else if (command !== "copy") {
  console.error(usage());
  process.exitCode = 1;
} else {
  const force = arguments_.includes("--force");
  const positional = arguments_.filter((argument) => argument !== "--force");
  if (positional.length > 1) {
    console.error(usage());
    process.exitCode = 1;
  } else {
    try {
      const destination = resolve(positional[0] ?? DEFAULT_COPY_DESTINATION);
      const entries = await copyRules(destination, { force });
      console.log("Copied Oxlint plugins:");
      console.log(`  anti-slop: ${entries.antiSlop}`);
      console.log(`  anti-slop-effect: ${entries.antiSlopEffect}`);
      console.log(`  timmo: ${entries.timmo}`);
      console.log(`  timmo-effect: ${entries.timmoEffect}`);
      printRuleSettings("General rule settings:", recommended.rules ?? {});
      printRuleSettings("Effect rule settings (opt-in):", effect.rules ?? {});
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
