import type { Plugin } from "@oxlint/plugins";

interface PluginWithRules {
  readonly rules: Readonly<Plugin["rules"]>;
}

export function enablePluginRules(namespace: string, plugin: PluginWithRules) {
  return Object.fromEntries(
    Object.keys(plugin.rules)
      .sort()
      .map((rule) => [`${namespace}/${rule}`, "error" as const]),
  );
}
