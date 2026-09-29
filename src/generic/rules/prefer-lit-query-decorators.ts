import { defineRule } from "@oxlint/plugins";

import { jsonObject } from "../../shared/json.ts";
import {
  litElementBaseClasses,
  litQueryDecoratorCall,
} from "../../shared/lit.ts";

import type { LitQueryMethod } from "../../shared/lit.ts";

const messageIds = {
  assignedElements: "preferQueryAssignedElements",
  assignedNodes: "preferQueryAssignedNodes",
  querySelector: "preferQuery",
  querySelectorAll: "preferQueryAll",
} as const satisfies Record<LitQueryMethod, string>;

/**
 * Prefer Lit query decorators over manual render-root queries. Follows
 * eslint-plugin-lit's `prefer-query-decorators` and also matches non-null,
 * optional, and asserted render roots.
 */
export const preferLitQueryDecoratorsRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require Lit query decorators instead of static render-root queries in Lit elements.",
    },
    schema: [
      {
        type: "object",
        properties: {
          querySelector: { type: "boolean" },
          querySelectorAll: { type: "boolean" },
          assignedElements: { type: "boolean" },
          assignedNodes: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [
      {
        querySelector: true,
        querySelectorAll: true,
        assignedElements: true,
        assignedNodes: true,
      },
    ],
    messages: {
      preferQuery:
        "Use the @query decorator instead of this.{{root}}.querySelector().",
      preferQueryAll:
        "Use the @queryAll decorator instead of this.{{root}}.querySelectorAll().",
      preferQueryAssignedElements:
        "Use the @queryAssignedElements decorator instead of this.{{root}}.querySelector().assignedElements().",
      preferQueryAssignedNodes:
        "Use the @queryAssignedNodes decorator instead of this.{{root}}.querySelector().assignedNodes().",
    },
  },
  create(context) {
    const bases = litElementBaseClasses(context.settings);
    const options = jsonObject(context.options[0]);

    const disabled = new Set(
      options
        ? Object.keys(options).filter((method) => options[method] === false)
        : [],
    );

    return {
      CallExpression(node) {
        const query = litQueryDecoratorCall(node, bases);

        if (!query || disabled.has(query.method)) return;
        context.report({
          node,
          messageId: messageIds[query.method],
          data: { root: query.root },
        });
      },
    };
  },
});
