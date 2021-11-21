import { JsxParser, ParserImplementations } from "./jsx-parser.model";

export class BaseParser implements Pick<JsxParser, 'isNode' & 'traverse'>{
  public isNode(obj: any) {
    return typeof obj === 'object' && 
        typeof (obj as any)?.end === 'number' && 
        typeof (obj as any)?.start === 'number' && 
        typeof (obj as any)?.type === 'string'
  }

  /**
   * Traverses the AST tree and calls callback for each node.
   * -
   * @param ast The ast tree
   * @param callback Callback function to be called for each node
   * @returns 
   */
  public traverse(ast: any, callback: Function) {
    for (let key of Object.keys(ast)) {
      if (['end', 'start', 'type'].includes(key)) { continue; }

      if (Array.isArray(ast[key])) {
        for (let nodeIndex in ast[key]) {
          ast[key][nodeIndex] = this.traverse(ast[key][nodeIndex], callback)
        }
      } else if(this.isNode(ast[key])) {
        ast[key] = this.traverse(ast[key], callback)
      }
    }

    const result = callback(ast);

    return typeof result !== 'undefined' ? result : ast
  }

  public findImplementation(ast: any) {
    let implementation: ParserImplementations = ParserImplementations.classic;
    this.traverse(ast, (node: any) => {
      if (node.type !== 'ImportDeclaration') {
        return
      }

      if (node.source.value === 'react/jsx-runtime') {
        implementation = ParserImplementations.new
      }
    })
    return implementation
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