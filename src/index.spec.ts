import { parse } from "acorn";
import { xxHash32 } from "js-xxhash";
import { rollup } from "rollup";
import { SourceMapConsumer } from "source-map-js";
import { reactScopedCssPlugin } from "./index";

const APP_ID = "/project/src/App.tsx";
const CSS_ID = "/project/src/App.scoped.css?scope=abcd1234";

const appCode = [
  'import { jsx as _jsx } from "react/jsx-runtime";',
  'import "./App.scoped.css";',
  "export default function App() {",
  '  return _jsx("div", { children: "hello" });',
  "}",
  "",
].join("\n");

const cssCode = ".content-container { width: 962px; }";

const getPostPlugin = (options = {}) => {
  const plugin = reactScopedCssPlugin(options).find(
    (candidate) => candidate.name === "rollup-plugin-react-scoped-css:post",
  );

  if (!plugin) {
    throw new Error("Could not find the post plugin");
  }

  return plugin;
};

const createPluginContext = () => ({
  // Mirrors Rollup's this.parse: an ESTree AST with start/end but no loc
  parse: (code: string) =>
    parse(code, { ecmaVersion: 2021, sourceType: "module" }),
});

const transform = (code: string, id: string, options = {}) => {
  const plugin = getPostPlugin(options);

  return (plugin.transform as any).call(createPluginContext(), code, id);
};

const getGeneratedPosition = (code: string, search: string) => {
  const lines = code.split("\n");
  const lineIndex = lines.findIndex((line) => line.includes(search));

  return {
    line: lineIndex + 1,
    column: lines[lineIndex].indexOf(search),
  };
};

const expectValidSourcemap = (map: string, source: string) => {
  const parsedMap = JSON.parse(map);

  expect(parsedMap.version).toBe(3);
  expect(parsedMap.sources).toEqual([source]);
  expect(parsedMap.mappings).not.toHaveLength(0);

  return parsedMap;
};

describe("reactScopedCssPlugin", () => {
  describe("transform hook", () => {
    it("returns code and a sourcemap when scoping jsx", () => {
      const hash = xxHash32(Buffer.from(APP_ID, "utf8"), 0).toString(16);
      const result = transform(appCode, APP_ID);

      expect(result.code).toContain(`"data-${hash}": true`);
      expect(result.map).toEqual(expect.any(String));

      const map = expectValidSourcemap(result.map, APP_ID);
      expect(map.sourcesContent).toEqual([appCode]);
    });

    it("maps the transformed jsx back to the original file", () => {
      const result = transform(appCode, APP_ID);
      const consumer = new SourceMapConsumer(result.map);
      const generatedPosition = getGeneratedPosition(result.code, "_jsx(");

      expect(consumer.originalPositionFor(generatedPosition)).toEqual({
        source: APP_ID,
        line: 4,
        column: 9,
        name: "_jsx",
      });
    });

    it("returns code and a sourcemap when scoping css", () => {
      const result = transform(cssCode, CSS_ID);

      expect(result.code).toContain(".content-container[data-abcd1234]");
      expect(result.map).toEqual(expect.any(String));

      expectValidSourcemap(result.map, CSS_ID);
    });

    it("maps the scoped css back to the original file", () => {
      const result = transform(cssCode, CSS_ID);
      const consumer = new SourceMapConsumer(result.map);
      const generatedPosition = getGeneratedPosition(
        result.code,
        ".content-container",
      );

      expect(consumer.originalPositionFor(generatedPosition)).toEqual({
        source: CSS_ID,
        line: 1,
        column: 0,
        name: null,
      });
    });

    it("does not transform jsx files without a scoped css import", () => {
      const code = appCode.replace('import "./App.scoped.css";', "");

      expect(transform(code, APP_ID)).toBeUndefined();
    });

    it("does not transform non scoped css files", () => {
      expect(transform(cssCode, "/project/src/App.css")).toBeUndefined();
    });

    it("does not transform files from node_modules", () => {
      expect(
        transform(cssCode, "/project/node_modules/lib/App.scoped.css?scope=1"),
      ).toBeUndefined();
    });
  });

  describe("rollup integration", () => {
    it("does not emit a SOURCEMAP_BROKEN warning", async () => {
      const warnings: any[] = [];

      const fixturePlugin = {
        name: "fixture",
        resolveId(source: string) {
          if (source === "entry") {
            return APP_ID;
          }
        },
        load(id: string) {
          if (id === APP_ID) {
            return appCode;
          }

          if (id.includes(".scoped.css")) {
            return cssCode;
          }
        },
      };

      // Mimics how Vite turns a transformed CSS file into a JS module
      const cssToJsPlugin = {
        name: "css-to-js",
        enforce: "post" as const,
        transform(_code: string, id: string) {
          if (id.includes(".scoped.css")) {
            return { code: "export default {};", map: null };
          }
        },
      };

      const bundle = await rollup({
        input: "entry",
        external: ["react/jsx-runtime"],
        onwarn(warning) {
          warnings.push(warning);
        },
        plugins: [...reactScopedCssPlugin(), fixturePlugin, cssToJsPlugin],
      });

      const output = await bundle.generate({ format: "esm", sourcemap: true });
      const sourcemapWarnings = warnings.filter(
        (warning) => warning.code === "SOURCEMAP_BROKEN",
      );
      const chunk = output.output.find((item) => item.type === "chunk");

      expect(sourcemapWarnings).toEqual([]);
      expect(
        chunk?.map?.sources.some((source) => source.endsWith("src/App.tsx")),
      ).toBe(true);
    });
  });
});
