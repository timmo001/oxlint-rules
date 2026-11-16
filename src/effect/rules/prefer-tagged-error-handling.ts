// Adapted from K-Mistele/anti-slop (MIT), a fork of dmmulroy/anti-slop.
import { defineRule } from "@oxlint/plugins";

import { staticMemberName } from "../../shared/ast.ts";
import { isInsideBroadEffectHandler } from "../../shared/tagged-values.ts";

import type { ESTree } from "@oxlint/plugins";

function isPredicateIsTagged(node: ESTree.Node): boolean {
  return (
    node.type === "MemberExpression" &&
    node.object.type === "Identifier" &&
    node.object.name === "Predicate" &&
    staticMemberName(node) === "isTagged"
  );
}

/** The value checked by `Predicate.isTagged(value, tag)` or `Predicate.isTagged(tag)(value)`. */
function taggedSubject(node: ESTree.CallExpression): ESTree.Node | undefined {
  if (isPredicateIsTagged(node.callee) && node.arguments.length === 2) {
    return node.arguments[0];
  }

  if (
    node.callee.type === "CallExpression" &&
    isPredicateIsTagged(node.callee.callee) &&
    node.callee.arguments.length === 1 &&
    node.arguments.length === 1
  ) {
    return node.arguments[0];
  }

  return undefined;
}

/** Handle tagged errors with Effect's tag handlers instead of checking them in a broad catch. */
export const preferTaggedErrorHandlingRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Use Effect tagged error handlers instead of `Predicate.isTagged` checks in a broad catch handler.",
    },
    messages: {
      taggedError:
        "Use Effect.catchTag or Effect.catchTags instead of checking the error with `Predicate.isTagged` in a broad Effect catch handler.",
      taggedReason:
        "Use Effect.catchReason or Effect.catchReasons instead of checking the error `reason` with `Predicate.isTagged` in a broad Effect catch handler.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const subject = taggedSubject(node);

        if (subject === undefined || !isInsideBroadEffectHandler(node)) return;

        context.report({
          node,
          messageId:
            staticMemberName(subject) === "reason"
              ? "taggedReason"
              : "taggedError",
        });
      },
    };
  },
});
