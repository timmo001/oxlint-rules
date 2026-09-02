import { defineRule } from "@oxlint/plugins";

import type { ESTree, Scope, SourceCode, Variable } from "@oxlint/plugins";

type FunctionNode = ESTree.Function | ESTree.ArrowFunctionExpression;

function resolveVariable(
  sourceCode: SourceCode,
  identifier: ESTree.IdentifierReference,
): Variable | null {
  let scope: Scope | null = sourceCode.getScope(identifier);
  while (scope) {
    const variable = scope.set.get(identifier.name);
    if (variable) return variable;
    scope = scope.upper;
  }
  return null;
}

function nearestEnclosingFunction(node: ESTree.Node): FunctionNode | null {
  let current: ESTree.Node | null = node.parent;
  while (current) {
    if (
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression"
    ) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function staticMemberName(node: ESTree.Expression): string | null {
  if (node.type !== "MemberExpression" || node.computed) return null;
  return node.property.type === "Identifier" ? node.property.name : null;
}

function isEffectImport(
  sourceCode: SourceCode,
  identifier: ESTree.IdentifierReference,
  namespace: boolean,
): boolean {
  const variable = resolveVariable(sourceCode, identifier);
  return (
    variable?.defs.some((definition) => {
      if (
        definition.type !== "ImportBinding" ||
        definition.parent?.type !== "ImportDeclaration" ||
        definition.parent.source.value !== "effect"
      ) {
        return false;
      }
      if (namespace) return definition.node.type === "ImportNamespaceSpecifier";
      if (definition.node.type !== "ImportSpecifier") return false;
      const imported = definition.node.imported;
      return (
        (imported.type === "Identifier" ? imported.name : imported.value) ===
        "Effect"
      );
    }) ?? false
  );
}

function isEffectMethod(
  sourceCode: SourceCode,
  node: ESTree.Expression,
  method: "fn" | "gen",
): boolean {
  if (staticMemberName(node) !== method || node.type !== "MemberExpression") {
    return false;
  }
  const object = node.object;
  if (object.type === "Identifier") {
    return isEffectImport(sourceCode, object, false);
  }
  if (
    staticMemberName(object) !== "Effect" ||
    object.type !== "MemberExpression" ||
    object.object.type !== "Identifier"
  ) {
    return false;
  }
  return isEffectImport(sourceCode, object.object, true);
}

function isDirectArgument(
  owner: FunctionNode,
  call: ESTree.CallExpression,
): boolean {
  return call.arguments.some((argument) => argument === owner);
}

function isRecognisedEffectGenerator(
  sourceCode: SourceCode,
  owner: FunctionNode,
): boolean {
  const parent = owner.parent;
  if (parent.type !== "CallExpression" || !isDirectArgument(owner, parent)) {
    return false;
  }
  if (isEffectMethod(sourceCode, parent.callee, "gen")) return true;

  const factoryCall = parent.callee;
  return (
    factoryCall.type === "CallExpression" &&
    isEffectMethod(sourceCode, factoryCall.callee, "fn")
  );
}

/** Keep expected failures in the Effect error channel inside Effect generators. */
export const noTryCatchInEffectGeneratorsRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow synchronous try/catch owned by recognised Effect generator callbacks.",
    },
    messages: {
      useEffectErrorChannel:
        "Keep expected failures in the Effect error channel. Use Effect.try for synchronous throwing work, Effect.tryPromise for asynchronous throwing work, Effect-returning schema APIs for decoding, and Effect recovery combinators for recovery.",
    },
  },
  create(context) {
    return {
      TryStatement(node) {
        if (!node.handler) return;
        const owner = nearestEnclosingFunction(node);
        if (
          !owner?.generator ||
          !isRecognisedEffectGenerator(context.sourceCode, owner)
        ) {
          return;
        }
        context.report({ node, messageId: "useEffectErrorChannel" });
      },
    };
  },
});
