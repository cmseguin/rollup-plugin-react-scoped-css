import { ClassicJsxParser } from "./parsers/classic-parser"
import { JsxParser, ParserImplementations } from "./parsers/jsx-parser.model"
import { NewJsxParser } from "./parsers/new-parser"

const classicParser = new ClassicJsxParser()
const newParser = new NewJsxParser()

let implementation: null | ParserImplementations = null
let parser: JsxParser = classicParser;

export function addHashAttributesToJsxTagsAst(program: any, attr: string) {
  // Once in the program, we can determine which parser to use
  if (implementation === null) {
    console.log('TEST')
    implementation = parser.findImplementation(program)

    if (implementation === ParserImplementations.new) {
      parser = newParser
    }
  }

  console.log(implementation)

  return parser.traverse(program, (node: any) => {
    if (parser.isNodeReactElement(node) && !parser.isNodeReactFragment(node)) {
      return parser.extendNodeWithAttributes(node, attr)
    }
  })
}