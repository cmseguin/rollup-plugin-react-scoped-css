import { parse } from "acorn";
import { addLocationsToAst } from "./addLocationsToAst";

describe("addLocationsToAst", () => {
  it("adds line and column locations based on the node offsets", () => {
    const code = `const a = 1;\nfunction f(x) {\n  return x + a;\n}\n`;
    const ast = parse(code, {
      ecmaVersion: 2021,
      sourceType: "module",
    });

    addLocationsToAst(ast, code, "test.js");

    expect(ast.loc).toEqual({
      start: { line: 1, column: 0 },
      end: { line: 5, column: 0 },
      source: "test.js",
    });

    const functionDeclaration = (ast.body[1] as any).loc;
    expect(functionDeclaration.start).toEqual({ line: 2, column: 0 });

    const returnStatement = (ast.body[1] as any).body.body[0].loc;
    expect(returnStatement.start).toEqual({ line: 3, column: 2 });
    expect(returnStatement.end).toEqual({ line: 3, column: 15 });
  });
});
