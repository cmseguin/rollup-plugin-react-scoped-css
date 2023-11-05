import { readFile } from "fs/promises";
import { resolve, join } from "path";

import { scopeCss } from "./scope-css";

describe("astIterator", () => {
  it("should iterate through all nodes", async () => {
    const mockCss = await readFile(
      resolve(join(__dirname, "..", "__mocks__", "mock-css.css")),
      { encoding: "utf-8" }
    );

    const mockCssResult = await readFile(
      resolve(join(__dirname, "..", "__mocks__", "mock-css-result.css")),
      { encoding: "utf-8" }
    );

    const result = scopeCss(mockCss, "mock-css.css", "data-v-123456");

    expect(result).toBe(mockCssResult);
  });
});
