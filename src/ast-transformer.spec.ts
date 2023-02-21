import { readFile } from "fs/promises";
import { resolve } from "path";
import { parse } from "acorn";
import { astTransformer } from "./ast-transformer";

describe("astTransformer", () => {
  it("should iterate through all nodes", async () => {
    let iterationCount = 0;
    const file = await readFile(
      resolve(__dirname, "./__mocks__/sample-code-file.js"),
      { encoding: "utf-8" }
    );
    const ast = parse(file, { sourceType: "module", ecmaVersion: 2022 });

    const newAst = astTransformer(ast, (node) => {
      iterationCount++;
      expect(node).toBeTruthy();
    });

    expect(newAst).toBeDefined();
    expect(iterationCount).toBe(28);
  });

  it("should handle array destructuring with an unbound element without errors", async () => {
    const file = await readFile(
      resolve(
        __dirname,
        "./__mocks__/sample-code-array-destructuring-unbound-element.js"
      ),
      { encoding: "utf-8" }
    );
    const ast = parse(file, { sourceType: "module", ecmaVersion: 2022 });

    const newAst = astTransformer(ast, () => {
      // do nothing
    });
    expect(newAst).toBeDefined();
  });
});
