import { BaseParser } from "./base-parser";
import { JsxParser } from "./jsx-parser.model";

export class NewJsxParser extends BaseParser implements JsxParser {
  isNodeReactFragment(node: any) {
    return node.arguments?.[0]?.type === "Identifier" &&
      node.arguments?.[0]?.name === "_Fragment"
  }
  
  isNodeReactElement(node: any) {
    return node?.type === 'CallExpression' &&
      ['_jsxDEV', '_jsx', '_jsxs'].includes(node?.callee?.name)
  }
}