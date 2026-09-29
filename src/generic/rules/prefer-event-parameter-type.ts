import { defineRule } from "@oxlint/plugins";

import { nearestEnclosingFunction } from "../../shared/ast.ts";

import type { TypeAssertion } from "../../shared/ast.ts";
import type { ESTree } from "@oxlint/plugins";

function staticMemberPath(
  node: ESTree.Expression,
): { readonly root: string; readonly path: readonly string[] } | null {
  const path: string[] = [];

  let current: ESTree.Node =
    node.type === "ChainExpression" ? node.expression : node;

  while (current.type === "MemberExpression") {
    if (current.computed || current.property.type !== "Identifier") {
      return null;
    }

    path.unshift(current.property.name);
    current = current.object;
  }

  return current.type === "Identifier" && path.length > 0
    ? { root: current.name, path }
    : null;
}

function isEventMemberPath(path: readonly string[]): boolean {
  const [first] = path;

  if (first === "detail") return true;

  return path.length === 1 && (first === "currentTarget" || first === "target");
}

/** Find an assertion of an event parameter's target, current target, or detail. */
export function assertedEventParameter(node: TypeAssertion): {
  readonly parameter: string;
  readonly property: string;
} | null {
  const member = staticMemberPath(node.expression);

  if (!member || !isEventMemberPath(member.path)) return null;

  const owner = nearestEnclosingFunction(node);

  if (
    !owner?.params.some(
      (parameter) =>
        parameter.type === "Identifier" && parameter.name === member.root,
    )
  ) {
    return null;
  }

  return {
    parameter: member.root,
    property: member.path.join("."),
  };
}

/** Prefer expressing an event's target or detail type in its handler parameter signature. */
export const preferEventParameterTypeRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer typing event target and detail properties in the handler parameter instead of asserting them at use sites.",
    },
    messages: {
      typeEventParameter:
        "Type `{{parameter}}.{{property}}` in the function signature instead of asserting it at the use site. Reuse the project's typed event helper if one fits, or add one.",
    },
  },
  create(context) {
    const checkAssertion = (node: TypeAssertion) => {
      const eventParameter = assertedEventParameter(node);

      if (!eventParameter) return;
      context.report({
        node,
        messageId: "typeEventParameter",
        data: eventParameter,
      });
    };

    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    };
  },
});
