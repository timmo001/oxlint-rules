// Adapted from K-Mistele/anti-slop (MIT), a fork of dmmulroy/anti-slop.
import { defineRule } from "@oxlint/plugins";

import { isTestFile } from "../../shared/ast.ts";
import { keyName } from "../../shared/effect-modules.ts";

import type { ESTree } from "@oxlint/plugins";

const unionSelectors: ReadonlySet<string> = new Set(["Exclude", "Extract"]);

/** Whether a type is a fixed tag, such as `"Ready"` or `"Ready" | "Done"`, rather than `string`. */
function isFixedTag(type: ESTree.TSType): boolean {
  if (type.type === "TSLiteralType") return true;

  return type.type === "TSUnionType" && type.types.every(isFixedTag);
}

/** Whether a signature picks members of an existing union, as in `Extract<Event, { _tag: "Ready" }>`. */
function selectsUnionMember(node: ESTree.TSPropertySignature): boolean {
  const literal = node.parent;
  const typeArguments = literal.parent;
  const reference = typeArguments?.parent;

  return (
    literal.type === "TSTypeLiteral" &&
    typeArguments?.type === "TSTypeParameterInstantiation" &&
    reference?.type === "TSTypeReference" &&
    reference.typeName.type === "Identifier" &&
    unionSelectors.has(reference.typeName.name)
  );
}

/** Derive tagged types from tagged constructors instead of declaring `_tag` by hand. */
export const noManualTaggedTypeRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Derive tagged types from a tagged Schema or Data constructor instead of declaring a fixed `_tag` in a type or interface.",
    },
    messages: {
      manualTaggedType:
        "Do not declare `_tag` by hand. Define the value with Schema.TaggedStruct, Schema.TaggedClass, Schema.TaggedError, Schema.TaggedUnion, Data.TaggedClass, Data.TaggedError, or Data.taggedEnum, then infer the type from it, e.g. `export type X = typeof X.Type`.",
    },
  },
  create(context) {
    if (isTestFile(context.filename)) return {};

    return {
      TSPropertySignature(node) {
        const type = node.typeAnnotation?.typeAnnotation;

        if (
          !node.computed &&
          keyName(node.key) === "_tag" &&
          type !== undefined &&
          isFixedTag(type) &&
          !selectsUnionMember(node)
        ) {
          context.report({ node, messageId: "manualTaggedType" });
        }
      },
    };
  },
});
