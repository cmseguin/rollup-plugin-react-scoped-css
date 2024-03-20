import { resolve } from "path";
import { readFile } from "fs/promises";
import { parse } from "acorn";
import { generate } from "escodegen";
import { addHashAttributesToJsxTagsAst } from "./ast-program";

import { transformAsync } from "@babel/core";

const getAstFromBabelPresetReactTransformer = async (
  file: string,
  presets: any[]
) => {
  const reactFile = await readFile(file, {
    encoding: "utf-8",
  });
  const compiled = await transformAsync(reactFile, {
    filename: "file.js",
    presets,
  });

  if (!compiled?.code) throw new Error("Could not compile file");

  const ast = parse(compiled.code, {
    ecmaVersion: 2021,
    sourceType: "module",
  });
  return ast;
};

const transformAstToCode = (ast: any) => {
  return generate(ast, {
    format: {
      indent: {
        style: "  ",
      },
      quotes: "double",
    },
  });
};

describe("AST Utils", () => {
  beforeEach(() => {
    global.implementation = null;
  });

  describe("classic implementation", () => {
    it("Should add the attr to the right elements without preset-env", async () => {
      const ast = await getAstFromBabelPresetReactTransformer(
        resolve(__dirname, "./__mocks__/react-file.js"),
        [["@babel/preset-react", { runtime: "classic" }]]
      );

      const compiledWithAttr = await readFile(
        resolve(__dirname, "./__mocks__/babel-preset-react-classic-output.js"),
        { encoding: "utf-8" }
      );

      const modifiedAst = addHashAttributesToJsxTagsAst(ast, "data-v-123456");
      const modifiedCompiled = transformAstToCode(modifiedAst);

      expect(modifiedCompiled).toEqual(compiledWithAttr);
    });

    it("Should add the attr to the right elements with preset-env", async () => {
      const ast = await getAstFromBabelPresetReactTransformer(
        resolve(__dirname, "./__mocks__/react-file.js"),
        [["@babel/preset-env"], ["@babel/preset-react", { runtime: "classic" }]]
      );

      const compiledWithAttr = await readFile(
        resolve(
          __dirname,
          "./__mocks__/babel-preset-env-react-classic-output.js"
        ),
        { encoding: "utf-8" }
      );

      const modifiedAst = addHashAttributesToJsxTagsAst(ast, "data-v-123456");
      const modifiedCompiled = transformAstToCode(modifiedAst);

      expect(modifiedCompiled).toEqual(compiledWithAttr);
    });
  });

  describe("automatic implementation", () => {
    it("Should add the attr to the right elements without preset-env", async () => {
      const ast = await getAstFromBabelPresetReactTransformer(
        resolve(__dirname, "./__mocks__/react-file.js"),
        [["@babel/preset-react", { runtime: "automatic" }]]
      );
      const compiledWithAttr = await readFile(
        resolve(
          __dirname,
          "./__mocks__/babel-preset-react-automatic-output.js"
        ),
        { encoding: "utf-8" }
      );

      const modifiedAst = addHashAttributesToJsxTagsAst(ast, "data-v-123456");
      const modifiedCompiled = transformAstToCode(modifiedAst);

      expect(modifiedCompiled).toEqual(compiledWithAttr);
    });

    it("Should add the attr to the right elements with preset-env", async () => {
      const ast = await getAstFromBabelPresetReactTransformer(
        resolve(__dirname, "./__mocks__/react-file.js"),
        [
          ["@babel/preset-env"],
          ["@babel/preset-react", { runtime: "automatic" }],
        ]
      );
      const compiledWithAttr = await readFile(
        resolve(
          __dirname,
          "./__mocks__/babel-preset-env-react-automatic-output.js"
        ),
        { encoding: "utf-8" }
      );

      const modifiedAst = addHashAttributesToJsxTagsAst(ast, "data-v-123456");
      const modifiedCompiled = transformAstToCode(modifiedAst);

      expect(modifiedCompiled).toEqual(compiledWithAttr);
    });
  });
});
