import { readFile } from "fs/promises";
import { resolve } from "path";
import { parse } from "acorn";
import { astIterator } from "./ast-iterator";

describe("astIterator", () => {
  it("should iterate through all nodes", async () => {
    let iterationCount = 0;
    const file = await readFile(
      resolve(__dirname, "./__mocks__/sample-code-file.js"),
      { encoding: "utf-8" }
    );
    const ast = parse(file, { sourceType: "module", ecmaVersion: 2022 });

    for (const node of astIterator(ast)) {
      iterationCount++;
      expect(node).toBeTruthy();
    }

    expect(iterationCount).toBe(28);
  });
});
