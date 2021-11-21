import { BaseParser } from "./base-parser";
import { JsxParser } from "./jsx-parser.model";

export class ClassicJsxParser extends BaseParser implements JsxParser {
  isNodeReactFragment(node: any) {
    return node?.arguments?.[0]?.object?.name === "React" && 
      node?.arguments?.[0]?.property?.name === "Fragment"
  }
  isNodeReactElement(node: any) {
    return node?.type === 'CallExpression' && 
      node?.callee?.object?.name === 'React' &&
      node?.callee?.property?.name === 'createElement'
  }
}