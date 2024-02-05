import { AstNode } from "rollup";
import { astIterator } from "../ast-iterator";
import { getSrcFromImportOrRequire, isNodeImportOrRequire } from "../ast.utils";

export const getImportDeclarationsValue = (root: AstNode) => {
  const urls = [];
  for (const node of astIterator(root)) {
    if (!isNodeImportOrRequire(node)) {
      continue;
    }

    const src = getSrcFromImportOrRequire(node);

    urls.push(src);
  }
  return urls;
};
