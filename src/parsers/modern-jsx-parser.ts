import {
  createObjectAssignCallExpressionWithIdentifier,
  createObjectExpressionWithAttr,
  extendObjectExpression,
  hackIntoExtenderCallExpression,
  isNodeExtender,
  isNodeIdentifier,
  isNodeObjectExpression,
} from "../ast.utils";
import { JsxParser } from "./jsx-parser.model";

export class ModernJsxParser implements JsxParser {
  private reactCalleeNames = [
    "_jsxDEV",
    "_jsx",
    "_jsxs",
    "jsxDev",
    "jsx",
    "jsxs",
    "jsxDEV",
  ];
  isNodeReactFragment(node: any) {
    // Always a call expression
    if (node?.type !== "CallExpression") {
      return false;
    }

    if (
      node.arguments?.[0]?.type === "Identifier" &&
      ["_Fragment", "Fragment"].includes(node.arguments?.[0]?.name)
    ) {
      return true;
    }

    if (
      node.arguments?.[0]?.type === "MemberExpression" &&
      ["_Fragment", "Fragment"].includes(node.arguments?.[0]?.property?.name)
    ) {
      return true;
    }

    return false;
  }

  isNodeReactElement(node: any) {
    // Always a call expression
    if (node?.type !== "CallExpression") {
      return false;
    }

    if (this.reactCalleeNames.includes(node?.callee?.name)) {
      return true;
    }

    if (
      node?.callee?.type === "SequenceExpression" &&
      this.reactCalleeNames.includes(
        node?.callee?.expressions?.[1]?.property?.name
      )
    ) {
      return true;
    }

    return false;
  }

  public extendNodeWithAttributes(node: any, attr: string) {
    return {
      ...node,
      arguments: node?.arguments.map((v: any, i: number) => {
        // Second argument is attributes so ignore others
        if (i !== 1) {
          return v;
        }

        const attrNode = this.createAttributeNode(attr);

        // If it's an object expression, extend it
        if (isNodeObjectExpression(v)) {
          return extendObjectExpression(v, attrNode);
        }

        // If it's an extender, hack into it
        if (isNodeExtender(v)) {
          return hackIntoExtenderCallExpression(v, attrNode);
        }

        // If it's an identifier, do Object.assign to be safe
        if (isNodeIdentifier(v)) {
          return createObjectAssignCallExpressionWithIdentifier(
            v,
            createObjectExpressionWithAttr(attrNode)
          );
        }

        // Worst case override with
        return createObjectExpressionWithAttr(attrNode);
      }),
    };
  }

  private createAttributeNode(attr: string) {
    return {
      type: "Property",
      method: false,
      shorthand: false,
      computed: false,
      key: {
        type: "Identifier",
        name: `"${attr}"`,
      },
      value: {
        type: "Literal",
        value: true,
        raw: "true",
      },
      kind: "init",
    };
  }
}
