/* eslint-disable no-useless-escape */
import { resolve, dirname } from "path";
import { xxHash32 } from "js-xxhash";
import { createFilter, FilterPattern } from "@rollup/pluginutils";
import { generate } from "escodegen";
import { addHashAttributesToJsxTagsAst } from "./ast-program";
import { scopeCss } from "./css/scope-css";

import type { Plugin } from "rollup";

const getFilenameFromPath = (filePath: string) => {
  const parts = filePath.split("/");
  return parts[parts.length - 1].split("?")[0];
};

const getHashFromPath = (filePath: string) => {
  const search = "?scope=";
  const hash = filePath.slice(filePath.indexOf(search) + search.length);
  return hash;
};

const generateHash = (input: string, seed = 0) => {
  const hashNum = xxHash32(Buffer.from(input, "utf8"), seed);
  return hashNum.toString(16);
};

export interface ReactScopedCssPluginOptions {
  /**
   * Which files should be included and parsed by the plugin
   * Default: undefined
   */
  include?: FilterPattern;

  /**
   * Which files should be exluded and that should not be parsed by the plugin
   * Default: undefined
   */
  exclude?: FilterPattern;

  /**
   * If you want regular files to be scoped & global files to be .global.css
   * Default: false
   */
  scopeStyleByDefault?: boolean;

  /**
   * If you want to customize the pattern for scoped styles.
   * This will only work if scopeStyleByDefault is false
   * Default: 'scoped'
   */
  scopedStyleSuffix?: string;

  /**
   * If you want to customize the pattern for global styles.
   * This will only work if scopeStyleByDefault is true
   * Default: 'global'
   */
  globalStyleSuffix?: string;

  /**
   * If you want to customize the pattern for style files.
   * Default: ['css', 'scss', 'sass', 'less']
   */
  styleFileExtensions?: string[];

  /**
   * If you want to customize the pattern for jsx files.
   * Default: ['jsx', 'tsx']
   */
  jsxFileExtensions?: string[];

  /**
   * If you want to customize the attribute prefix that is added to the jsx elements
   * Default: undefined
   */
  hashPrefix?: string;
}

export interface VitePartialPlugin extends Plugin {
  enforce?: "pre" | "post";
}

export function reactScopedCssPlugin(
  optionsIn: ReactScopedCssPluginOptions = {}
): VitePartialPlugin[] {
  const options: Partial<ReactScopedCssPluginOptions> = {
    scopeStyleByDefault: false,
    scopedStyleSuffix: "scoped",
    globalStyleSuffix: "global",
    styleFileExtensions: ["css", "scss", "sass", "less"],
    jsxFileExtensions: ["jsx", "tsx"],
    ...optionsIn,
  };

  const {
    exclude,
    globalStyleSuffix,
    hashPrefix,
    jsxFileExtensions,
    include,
    scopeStyleByDefault,
    scopedStyleSuffix,
    styleFileExtensions,
  } = options;

  if (!styleFileExtensions || !styleFileExtensions.length) {
    throw new Error("You need to provide at least one style file extension");
  }

  if (!jsxFileExtensions || !jsxFileExtensions.length) {
    throw new Error("You need to provide at least one jsx file extension");
  }

  const filter = createFilter(include, exclude);
  const scopedCssRegex = new RegExp(
    !scopeStyleByDefault
      ? `([^\.]+\.${scopedStyleSuffix}\.(${styleFileExtensions.join("|")}))$`
      : `([^\.]+\.(${styleFileExtensions.join("|")}))$`
  );
  const scopedCssInFileRegex = new RegExp(
    !scopeStyleByDefault
      ? `([^\.]+\.${scopedStyleSuffix}\.(${styleFileExtensions.join(
          "|"
        )}))(\"|\')`
      : `([^\.]+\.(${styleFileExtensions.join("|")}))(\"|\')`
  );

  const globalCssRegex = new RegExp(
    `\.${globalStyleSuffix}\.(${styleFileExtensions.join("|")})$`
  );

  const jsxRegex = new RegExp(`\.(${jsxFileExtensions.join("|")})$`);

  return [
    {
      name: "rollup-plugin-react-scoped-css:pre",
      resolveId(source, importer) {
        if (!importer) {
          return;
        }

        if (scopedCssRegex.test(source) && jsxRegex.test(importer)) {
          if (scopeStyleByDefault && globalCssRegex.test(source)) {
            return;
          }

          const importerHash = generateHash(importer);
          const url = resolve(
            dirname(importer),
            `${source}?scope=${importerHash}`
          );
          return url;
        }
      },
      enforce: "pre",
    },
    {
      name: "rollup-plugin-react-scoped-css:post",
      transform(code, id) {
        if (!filter(id) || id.includes("node_modules")) {
          return;
        }

        const matches = code.match(scopedCssInFileRegex);

        const shouldScope = matches?.some((match) => {
          return !(scopeStyleByDefault && globalCssRegex.test(match));
        });

        if (shouldScope) {
          const importerHash = generateHash(id);
          const program = this.parse(code);
          const scopedAttr = hashPrefix
            ? `data-${hashPrefix}-${importerHash}`
            : `data-${importerHash}`;
          const newAst = addHashAttributesToJsxTagsAst(program, scopedAttr);
          const newCode = generate(newAst);
          return newCode;
        }

        if (scopedCssRegex.test(getFilenameFromPath(id))) {
          if (scopeStyleByDefault && globalCssRegex.test(id)) {
            return;
          }

          const importerHash = getHashFromPath(id);
          const scopedAttr = options.hashPrefix
            ? `data-${options.hashPrefix}-${importerHash}`
            : `data-${importerHash}`;
          return scopeCss(code, getFilenameFromPath(id), scopedAttr);
        }
      },
    },
  ];
}
