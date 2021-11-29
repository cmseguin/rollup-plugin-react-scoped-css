import { astIterator } from "./ast-iterator"
import { astTransformer } from "./ast-transformer"
import { ClassicJsxParser } from "./parsers/classic-parser"
import { JsxParser, ParserImplementations } from "./parsers/jsx-parser.model"
import { NewJsxParser } from "./parsers/new-parser"

declare global {
  var implementation: null | ParserImplementations
}

global.implementation = null

const classicParser = new ClassicJsxParser()
const newParser = new NewJsxParser()

let parser: JsxParser = classicParser;

const findImplementation = (program: any) => {
  let implementation: ParserImplementations = ParserImplementations.classic;
  for (let node of astIterator(program)) {
    if (node.type !== 'ImportDeclaration') {
      continue;
    }
    
    console.log(JSON.stringify(node, null, 2));

    if (
      node.specifiers.some((n: any) => 
        ['_jsxDEV', 'jsxRuntime'].includes(n.local.name))
      || ['react/jsx-dev-runtime', 'react/jsx-runtime'].includes(node.source.value)
    ) {
      return ParserImplementations.new
    }
  }
  return implementation
}

export function addHashAttributesToJsxTagsAst(program: any, attr: string) {
  // Once in the program, we can determine which parser to use
  if (global.implementation === null) {
    global.implementation = findImplementation(program)
    
    if (global.implementation === ParserImplementations.new) {
      parser = newParser
    }
  }

  console.log('implementation', implementation)
  
  return astTransformer(program, (node: any) => {
    if (parser.isNodeReactElement(node) && !parser.isNodeReactFragment(node)) {
      return parser.extendNodeWithAttributes(node, attr)
    }
  })
}