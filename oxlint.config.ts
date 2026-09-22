import { defineConfig } from "oxlint";

import recommendedEffect from "./src/configs/recommended-effect.ts";

export default defineConfig({
  extends: [recommendedEffect],
  options: {
    typeAware: true,
  },
  ignorePatterns: [
    ".agent/**",
    ".agents/**",
    ".claude/**",
    ".codex/**",
    ".continue/**",
    ".cursor/**",
    ".gemini/**",
    ".opencode/**",
    ".opencode-daemon/**",
    ".pi/**",
    ".roo/**",
    ".windsurf/**",
    "dist/**",
    "vendor/anti-slop/**",
  ],
});
