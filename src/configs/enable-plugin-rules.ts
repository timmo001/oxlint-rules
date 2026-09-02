interface PluginWithRules {
  readonly rules: Readonly<Record<string, unknown>>;
}

export function enablePluginRules(namespace: string, plugin: PluginWithRules) {
  return Object.fromEntries(
    Object.keys(plugin.rules)
      .sort()
      .map((rule) => [`${namespace}/${rule}`, "error" as const]),
  );
}
