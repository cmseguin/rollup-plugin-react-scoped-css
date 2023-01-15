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

export class LegacyJsxParser implements JsxParser {
  public isNodeReactFragment(node: any) {
    return (
      (node?.callee?.object?.name === "React" ||
        node?.callee?.object?.object?.name === "_react") &&
      node?.arguments?.[0]?.property?.name === "Fragment"
    );
  }

  public isNodeReactElement(node: any) {
    return (
      node?.type === "CallExpression" &&
      (node?.callee?.object?.name === "React" ||
        node?.callee?.object?.object?.name === "_react") &&
      node?.callee?.property?.name === "createElement"
    );
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
