import { JsxParser } from "./jsx-parser.model";

export class NewJsxParser implements JsxParser {
  isNodeReactFragment(node: any) {
    return node.arguments?.[0]?.type === "Identifier" &&
    ['_Fragment', 'Fragment'].includes(node.arguments?.[0]?.name)
  }
  
  isNodeReactElement(node: any) {
    return node?.type === 'CallExpression' &&
      ['_jsxDEV', '_jsx', '_jsxs', 'jsxDev', 'jsx', 'jsxs'].includes(node?.callee?.name)
  }

  public extendNodeWithAttributes(node: any, attr: string) {
    const arg = node?.arguments?.[1]
    return {
      ...node,
      arguments: node?.arguments.map((v: any, i: number) => {
        if (i === 1) {
            if (v.type === 'ObjectExpression') {
              return {
                ...v,
                properties: [
                  ...arg.properties,
                  this.createAttributeNode(attr)
                ]
              }
            } else {
              return {
                type: 'ObjectExpression',
                properties: [this.createAttributeNode(attr)]
              }
            }
          }
          return v
        })
      }
  }

  private createAttributeNode(attr: string) {
    return {
      type: 'Property',
      method: false,
      shorthand: false,
      computed: false,
      key: {
        type: 'Identifier',
        name: `"${attr}"`
      },
      value: {
        type: 'Literal',
        value: true,
        raw: "true"
      },
      kind: 'init'
    }
  }
}