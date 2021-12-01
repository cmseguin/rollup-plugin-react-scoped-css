import { JsxParser } from "./jsx-parser.model";

export class ClassicJsxParser implements JsxParser {
  isNodeReactFragment(node: any) {
    return (
      node?.arguments?.[0]?.object?.name === "React" &&
      node?.arguments?.[0]?.property?.name === "Fragment"
    );
  }
  isNodeReactElement(node: any) {
    return (
      node?.type === "CallExpression" &&
      node?.callee?.object?.name === "React" &&
      node?.callee?.property?.name === "createElement"
    );
  }

  public extendNodeWithAttributes(node: any, attr: string) {
    const arg = node?.arguments?.[1];
    return {
      ...node,
      arguments: node?.arguments.map((v: any, i: number) => {
        if (i === 1) {
          if (v.type === "ObjectExpression") {
            return {
              ...v,
              properties: [...arg.properties, this.createAttributeNode(attr)],
            };
          } else {
            return {
              type: "ObjectExpression",
              properties: [this.createAttributeNode(attr)],
            };
          }
        }
        return v;
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
