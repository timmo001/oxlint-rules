import { defineConfig } from "oxlint";

export default defineConfig({
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
