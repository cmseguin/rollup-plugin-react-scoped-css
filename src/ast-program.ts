import { astIterator } from "./ast-iterator";
import { astTransformer } from "./ast-transformer";
import { getSrcFromImportOrRequire, isNodeImportOrRequire } from "./ast.utils";
import { ClassicJsxParser } from "./parsers/classic-parser";
import { JsxParser, ParserImplementations } from "./parsers/jsx-parser.model";
import { NewJsxParser } from "./parsers/new-parser";

declare global {
  // eslint-disable-next-line
  var implementation: null | ParserImplementations;
}

global.implementation = null;

const classicParser = new ClassicJsxParser();
const newParser = new NewJsxParser();

let parser: JsxParser = classicParser;

const findImplementation = (program: any) => {
  const implementation: ParserImplementations = ParserImplementations.classic;
  for (const node of astIterator(program)) {
    if (!isNodeImportOrRequire(node)) {
      continue;
    }

    const src = getSrcFromImportOrRequire(node);

    if (["react/jsx-dev-runtime", "react/jsx-runtime"].includes(src)) {
      return ParserImplementations.new;
    }
  }
  return implementation;
};

export function addHashAttributesToJsxTagsAst(program: any, attr: string) {
  // Once in the program, we can determine which parser to use
  if (global.implementation === null) {
    global.implementation = findImplementation(program);

    if (global.implementation === ParserImplementations.new) {
      parser = newParser;
    }
  }

  return astTransformer(program, (node: any) => {
    if (parser.isNodeReactElement(node) && !parser.isNodeReactFragment(node)) {
      return parser.extendNodeWithAttributes(node, attr);
    }
  });
}
