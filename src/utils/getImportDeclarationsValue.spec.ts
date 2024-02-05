import { parseAst } from "rollup/parseAst";
import fs from "fs";
import { resolve } from "path";
import { getImportDeclarationsValue } from "./getImportDeclarationsValue";

describe("getImportDeclarationsValue", () => {
  it("should return an array of urls", () => {
    const content = fs.readFileSync(
      resolve(__dirname, "../__mocks__/file-with-imports.js"),
      "utf-8"
    );
    console.log(parseAst);
    const rootNode = parseAst(content, { allowReturnOutsideFunction: true });

    expect(getImportDeclarationsValue(rootNode)).toEqual([
      "test.css",
      "test.scss",
      "test.scoped.css",
      "test.global.css",
      "test.random.css",
      "react",
    ]);
  });
});
