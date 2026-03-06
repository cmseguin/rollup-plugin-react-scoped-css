import { astIterator } from "./ast-iterator.ts";
import { astTransformer } from "./ast-transformer.ts";
import {
  getSrcFromImportOrRequire,
  isNodeImportOrRequire,
} from "./ast.utils.ts";
import { LegacyJsxParser } from "./parsers/legacy-jsx-parser.ts";
import { ModernJsxParser } from "./parsers/modern-jsx-parser.ts";
import {
  JsxParser,
  ParserImplementations,
} from "./parsers/jsx-parser.model.ts";

declare global {
  var implementation: null | ParserImplementations;
}

global.implementation = null;

const legacyJsxParser = new LegacyJsxParser();
const modernJsxParser = new ModernJsxParser();

let parser: JsxParser = legacyJsxParser;

const findImplementation = (program: any) => {
  const implementation: ParserImplementations = ParserImplementations.legacy;
  for (const node of astIterator(program)) {
    if (!isNodeImportOrRequire(node)) {
      continue;
    }

    const src = getSrcFromImportOrRequire(node);

    if (["react/jsx-dev-runtime", "react/jsx-runtime"].includes(src)) {
      return ParserImplementations.modern;
    }
  }
  return implementation;
};

export function addHashAttributesToJsxTagsAst(program: any, attr: string) {
  // Once in the program, we can determine which parser to use
  if (global.implementation === null) {
    global.implementation = findImplementation(program);

    if (global.implementation === ParserImplementations.modern) {
      parser = modernJsxParser;
    }
  }

  return astTransformer(program, (node: any) => {
    if (parser.isNodeReactElement(node) && !parser.isNodeReactFragment(node)) {
      return parser.extendNodeWithAttributes(node, attr);
    }
  });
}
