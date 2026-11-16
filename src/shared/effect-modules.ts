// Adapted from K-Mistele/anti-slop (MIT), a fork of dmmulroy/anti-slop.
import type { ESTree } from "@oxlint/plugins";

/** Effect modules whose members the Effect rules recognise. */
export type EffectModule = "Context" | "Effect" | "Layer" | "ManagedRuntime";

const effectModules: ReadonlySet<string> = new Set<EffectModule>([
  "Context",
  "Effect",
  "Layer",
  "ManagedRuntime",
]);

/** Local names bound to each Effect module by the file's imports. */
export type EffectModuleNames = ReadonlyMap<EffectModule, ReadonlySet<string>>;

function isEffectModule(name: string): name is EffectModule {
  return effectModules.has(name);
}

/** Collect `import { Effect } from "effect"` and `import * as Effect from "effect/Effect"` bindings. */
export function collectEffectModuleNames(
  program: ESTree.Program,
): EffectModuleNames {
  const names = new Map<EffectModule, Set<string>>();

  const add = (module: EffectModule, local: string) => {
    const existing = names.get(module) ?? new Set<string>();
    existing.add(local);
    names.set(module, existing);
  };

  for (const statement of program.body) {
    if (statement.type !== "ImportDeclaration") continue;
    const source = statement.source.value;

    if (source === "effect") {
      for (const specifier of statement.specifiers) {
        if (specifier.type !== "ImportSpecifier") continue;
        const imported = specifier.imported;

        const name =
          imported.type === "Identifier" ? imported.name : imported.value;

        if (isEffectModule(name)) add(name, specifier.local.name);
      }

      continue;
    }

    const module = source.startsWith("effect/")
      ? source.slice("effect/".length)
      : "";

    if (!isEffectModule(module)) continue;

    for (const specifier of statement.specifiers) {
      if (
        specifier.type === "ImportNamespaceSpecifier" ||
        specifier.type === "ImportDefaultSpecifier"
      ) {
        add(module, specifier.local.name);
      }
    }
  }

  return names;
}

/** Strip parentheses, type assertions and instantiation expressions from a node. */
export function unwrapNode(node: ESTree.Node): ESTree.Node {
  let current = node;

  while (
    current.type === "ParenthesizedExpression" ||
    current.type === "TSAsExpression" ||
    current.type === "TSSatisfiesExpression" ||
    current.type === "TSTypeAssertion" ||
    current.type === "TSNonNullExpression" ||
    current.type === "TSInstantiationExpression"
  ) {
    current = current.expression;
  }

  return current;
}

/** The member name when `node` is `<module>.<member>` for one of the module's local names, else null. */
export function moduleMemberName(
  node: ESTree.Node | null | undefined,
  names: EffectModuleNames,
  module: EffectModule,
): string | null {
  if (!node) return null;

  const expression =
    node.type === "TSInstantiationExpression" ? node.expression : node;

  if (
    expression.type !== "MemberExpression" ||
    expression.computed ||
    expression.object.type !== "Identifier" ||
    !(names.get(module)?.has(expression.object.name) ?? false) ||
    expression.property.type !== "Identifier"
  ) {
    return null;
  }

  return expression.property.name;
}

/** The member name when `node` is a call of `<module>.<member>(...)`, else null. */
export function moduleCallName(
  node: ESTree.Node | null | undefined,
  names: EffectModuleNames,
  module: EffectModule,
): string | null {
  return node?.type === "CallExpression"
    ? moduleMemberName(unwrapNode(node.callee), names, module)
    : null;
}

/** Whether a class is `class X extends Context.Service<...>()("key", options) {}`. */
export function isServiceClass(
  node: ESTree.Class,
  names: EffectModuleNames,
): boolean {
  if (node.superClass === null) return false;
  const superClass = unwrapNode(node.superClass);

  if (superClass.type !== "CallExpression") return false;
  const factory = unwrapNode(superClass.callee);

  return (
    factory.type === "CallExpression" &&
    moduleMemberName(unwrapNode(factory.callee), names, "Context") === "Service"
  );
}

/** The name of a non-computed property key, or null. Literal keys compare by their string form. */
export function keyName(key: ESTree.Node): string | null {
  if (key.type === "Identifier" || key.type === "PrivateIdentifier") {
    return key.name;
  }

  return key.type === "Literal" ? String(key.value) : null;
}

/** The generator passed to `Effect.gen(...)`, or null when `node` is not such a call. */
export function genFunction(
  node: ESTree.Node | null,
  names: EffectModuleNames,
): ESTree.Function | null {
  if (node?.type !== "CallExpression") return null;

  if (moduleCallName(node, names, "Effect") !== "gen") return null;
  const body = node.arguments.at(-1);

  return body?.type === "FunctionExpression" ? body : null;
}

/** For `x.pipe(...)`, the receiver `x`; otherwise null. */
export function pipeReceiver(node: ESTree.Node): ESTree.Node | null {
  if (node.type !== "CallExpression") return null;
  const callee = unwrapNode(node.callee);

  return callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier" &&
    callee.property.name === "pipe"
    ? unwrapNode(callee.object)
    : null;
}

/**
 * The steps that run before `call` when it is an argument of a pipeline-like call such as `x.pipe(a, call)`,
 * `pipe(x, a, call)`, or `Effect.fn("name")(body, a, call)`, including earlier `.pipe(...)` receivers.
 */
export function precedingSteps(call: ESTree.Node): readonly ESTree.Node[] {
  const parent = call.parent;

  if (parent?.type !== "CallExpression") return [];
  const index = parent.arguments.findIndex((argument) => argument === call);

  if (index < 0) return [];
  const steps: ESTree.Node[] = [];
  let receiver = pipeReceiver(parent);

  while (receiver !== null) {
    steps.push(receiver);

    if (receiver.type === "CallExpression") steps.push(...receiver.arguments);
    receiver = pipeReceiver(receiver);
  }

  steps.push(...parent.arguments.slice(0, index));

  return steps;
}
