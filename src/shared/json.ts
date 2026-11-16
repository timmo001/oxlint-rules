import type { Settings } from "@oxlint/plugins";

/** Narrow a rule option or setting, which Oxlint passes as untyped JSON. */
export function jsonObject(
  value: Settings[string] | undefined,
): Readonly<Settings> | null {
  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- Oxlint settings and options are the JSON input boundary.
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value
    : null;
}

/** Narrow a rule option to its string items, which Oxlint passes as untyped JSON. */
export function jsonStrings(
  value: Settings[string] | undefined,
): readonly string[] {
  return Array.isArray(value)
    ? value.filter(
        // oxlint-disable-next-line anti-slop/no-runtime-typeof -- Oxlint settings and options are the JSON input boundary.
        (item) => typeof item === "string",
      )
    : [];
}
