import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

import presetReact from "@babel/preset-react";
import presetTypescript from "@babel/preset-typescript";

// Compile TSX to the automatic JSX runtime before the scoped-css transform
// runs. The plugin inspects React.createElement/jsx() calls, so it must see
// compiled output rather than raw JSX.
const BABEL_OPTIONS = {
  babelHelpers: "bundled",
  extensions: [".js", ".jsx", ".ts", ".tsx"],
  exclude: "**/node_modules/**",
  babelrc: false,
  configFile: false,
  presets: [
    [presetReact, { runtime: "automatic" }],
    presetTypescript,
  ],
};

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Scoped CSS E2E Fixture</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.js"></script>
  </body>
</html>
`;

const splitQuery = (id) => id.split("?")[0];

const isCssId = (id) => splitQuery(id).endsWith(".css");

/**
 * The plugin rewrites scoped imports to `<file>?scope=<hash>`. These two
 * plugins provide the raw CSS to the scoped transform and then turn the
 * transformed CSS into an extracted stylesheet plus a no-op JS module.
 */
function createCssPlugins() {
  const cssByFile = new Map();

  return [
    {
      name: "e2e-css-load",
      load(id) {
        if (isCssId(id)) {
          return readFile(splitQuery(id), "utf8");
        }
      },
    },
    {
      name: "e2e-css-emit",
      transform(code, id) {
        if (!isCssId(id)) {
          return;
        }

        cssByFile.set(splitQuery(id), code);
        return { code: "export default undefined;", map: null };
      },
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "styles.css",
          source: [...cssByFile.values()].join("\n"),
        });
        this.emitFile({
          type: "asset",
          fileName: "index.html",
          source: INDEX_HTML,
        });
      },
    },
  ];
}

const outputOptions = (outDir) => ({
  dir: outDir,
  format: "esm",
  entryFileNames: "main.js",
  chunkFileNames: "[name]-[hash].js",
  assetFileNames: "[name][extname]",
  sourcemap: true,
});

/**
 * Build the shared fixture with standalone Rollup. `api` is loaded from the
 * per-setup install directory so every bundler dependency resolves from there.
 */
export async function buildWithRollup({ api, fixtureDir, outDir }) {
  const {
    rollup,
    babel,
    commonjs,
    nodeResolve,
    reactScopedCssPlugin,
    replace,
  } = api;
  const [scopedPre, scopedPost] = reactScopedCssPlugin();
  const [cssLoader, cssEmitter] = createCssPlugins();

  const bundle = await rollup({
    input: path.join(fixtureDir, "src", "main.tsx"),
    plugins: [
      scopedPre,
      babel(BABEL_OPTIONS),
      cssLoader,
      scopedPost,
      cssEmitter,
      replace({
        preventAssignment: true,
        values: { "process.env.NODE_ENV": JSON.stringify("production") },
      }),
      nodeResolve({ extensions: [".js", ".jsx", ".ts", ".tsx"] }),
      commonjs(),
    ],
  });

  try {
    await bundle.write(outputOptions(outDir));
  } finally {
    await bundle.close();
  }
}

/**
 * Build the shared fixture with Rolldown. Babel must run before the scoped
 * transform just like with Rollup; Rolldown resolves node_modules and CommonJS
 * itself. `moduleTypes` keeps Rolldown from treating the `.css` modules as CSS
 * after the e2e CSS plugin has turned them into JavaScript.
 */
export async function buildWithRolldown({ api, fixtureDir, outDir }) {
  const { rolldown, babel, reactScopedCssPlugin } = api;
  const [scopedPre, scopedPost] = reactScopedCssPlugin();
  const [cssLoader, cssEmitter] = createCssPlugins();

  const bundle = await rolldown({
    input: path.join(fixtureDir, "src", "main.tsx"),
    platform: "browser",
    moduleTypes: { ".css": "js" },
    transform: {
      define: { "process.env.NODE_ENV": JSON.stringify("production") },
    },
    plugins: [
      scopedPre,
      babel(BABEL_OPTIONS),
      cssLoader,
      scopedPost,
      cssEmitter,
    ],
  });

  try {
    await bundle.write(outputOptions(outDir));
  } finally {
    await bundle.close();
  }
}

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

/** Minimal static server so Playwright can load the emitted bundle. */
export async function serveDirectory(directory) {
  const root = path.resolve(directory);

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      const relative = decodeURIComponent(url.pathname);
      const file = path.join(
        root,
        relative === "/" ? "index.html" : relative,
      );

      if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403).end("forbidden");
        return;
      }

      const body = await readFile(file);
      response.writeHead(200, {
        "content-type":
          CONTENT_TYPES[path.extname(file)] ?? "application/octet-stream",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end("not found");
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/`;

  return {
    url,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
