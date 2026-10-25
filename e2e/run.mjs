#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import assert from "node:assert/strict";

import { chromium, firefox, webkit } from "playwright";

import {
  assertBuiltArtifacts,
  assertDiagnostics,
  assertScopedApp,
  assertViteMessages,
  attachDiagnostics,
  expectStyle,
  readDomState,
} from "./assertions.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const FIXTURE = path.join(HERE, "fixture");
const CACHE = path.join(HERE, ".cache");
const PACK_DIR = path.join(CACHE, "pack");

// Latest release of each major at the time this harness was written.
const VITE_MATRIX = {
  5: "5.4.21",
  6: "6.4.5",
  7: "7.3.7",
  8: "8.3.5",
};
const PLUGIN_REACT = "5.2.0";
const REACT = "18.3.1";
const ROLLUP = "^4.65.0";
const FIXTURE_REV = 1;
const NPM = process.platform === "win32" ? "npm.cmd" : "npm";
const BROWSERS = { chromium, firefox, webkit };

const HELP = `Usage: node e2e/run.mjs [options]

Options:
  -v, --vite <major>            Vite major to test. Repeatable or comma-separated.
                                Default: 5,6,7,8
      --mode <dev|build|both>   Which modes to run. Default: both
      --browser <name>          chromium, firefox, or webkit. Default: chromium
      --headed                  Run the browser with a visible window
      --keep-temp               Keep build artifacts and installs after the run
      --clean                   Remove the e2e cache before running
      --force                   Reinstall Vite even when the cache stamp matches
      --allow-broken-sourcemap  Do not fail on Vite sourcemap warnings
  -h, --help                    Show this message
`;

const { values } = parseArgs({
  options: {
    vite: { type: "string", multiple: true, short: "v" },
    mode: { type: "string", default: "both" },
    browser: { type: "string", default: "chromium" },
    headed: { type: "boolean", default: false },
    "keep-temp": { type: "boolean", default: false },
    clean: { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    "allow-broken-sourcemap": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: false,
});

if (values.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
if (nodeMajor < 20 || (nodeMajor === 20 && nodeMinor < 19)) {
  console.error(
    `Node >= 20.19 is required (found ${process.versions.node}). ` +
      "Vite 7/8, @vitejs/plugin-react 5, and Playwright all require it.",
  );
  process.exit(1);
}

if (!["dev", "build", "both"].includes(values.mode)) {
  fail(`Invalid --mode "${values.mode}". Use dev, build, or both.`);
}
const modes = values.mode === "both" ? ["dev", "build"] : [values.mode];

const browserName = values.browser;
if (!BROWSERS[browserName]) {
  fail(`Invalid --browser "${browserName}". Use chromium, firefox, or webkit.`);
}

const viteMajors = (
  values.vite?.length
    ? values.vite.flatMap((value) => value.split(","))
    : Object.keys(VITE_MATRIX)
)
  .map((value) => value.trim())
  .filter(Boolean);

for (const major of viteMajors) {
  if (!VITE_MATRIX[major]) {
    fail(
      `Unsupported Vite major "${major}". Supported: ${Object.keys(VITE_MATRIX).join(", ")}.`,
    );
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

function runNpm(args, options = {}) {
  return execFileSync(NPM, args, {
    stdio: "inherit",
    ...options,
    shell: process.platform === "win32",
  });
}

function captureNpm(args, options = {}) {
  return execFileSync(NPM, args, {
    encoding: "utf8",
    ...options,
    shell: process.platform === "win32",
  });
}

function stripAnsi(value) {
  return value.replace(/\[[0-9;]*m/g, "");
}

async function exists(filePath) {
  try {
    await readFile(filePath, "utf8");
    return true;
  } catch {
    return false;
  }
}

function makeLogger(vite, prefix) {
  const messages = [];
  const logger = vite.createLogger("info", { prefix });

  for (const level of ["warn", "warnOnce", "error"]) {
    if (typeof logger[level] !== "function") {
      continue;
    }
    const original = logger[level].bind(logger);
    logger[level] = (message, options) => {
      messages.push({
        level: level === "warnOnce" ? "warn" : level,
        msg: stripAnsi(String(message)),
      });
      original(message, options);
    };
  }

  return { logger, messages };
}

function serverUrl(server) {
  const local = server.resolvedUrls?.local?.[0];
  if (local) {
    return local;
  }

  const address = server.httpServer?.address();
  if (address && typeof address === "object") {
    return `http://127.0.0.1:${address.port}/`;
  }

  throw new Error("Could not determine the Vite server URL");
}

async function packPlugin() {
  await rm(PACK_DIR, { recursive: true, force: true });
  await mkdir(PACK_DIR, { recursive: true });

  const output = captureNpm(
    ["pack", "--json", "--ignore-scripts", "--pack-destination", PACK_DIR],
    { cwd: ROOT },
  );
  const [packInfo] = JSON.parse(output);
  const files = packInfo.files.map((file) => file.path);

  assert.ok(
    files.includes("dist/index.js"),
    "packed tarball is missing dist/index.js",
  );
  assert.ok(
    !files.some(
      (file) => file.startsWith("e2e/") || file.startsWith("examples/"),
    ),
    `packed tarball must not include the e2e harness:\n${files.join("\n")}`,
  );

  return path.join(PACK_DIR, packInfo.filename);
}

async function ensureInstall(major, tarball) {
  const version = VITE_MATRIX[major];
  const installDir = path.join(CACHE, `vite-${major}`);
  const fixtureDir = path.join(installDir, "fixture");

  await mkdir(installDir, { recursive: true });

  const packageJson = {
    name: `react-scoped-css-e2e-vite-${major}`,
    private: true,
    version: "0.0.0",
    type: "module",
    dependencies: {
      "@vitejs/plugin-react": PLUGIN_REACT,
      "rollup-plugin-react-scoped-css": "file:./plugin.tgz",
      react: REACT,
      "react-dom": REACT,
    },
    devDependencies: {
      vite: version,
      rollup: ROLLUP,
    },
  };
  const packageJsonText = `${JSON.stringify(packageJson, null, 2)}\n`;
  const tarballBytes = await readFile(tarball);
  const stamp = createHash("sha256")
    .update(packageJsonText)
    .update(tarballBytes)
    .update(String(FIXTURE_REV))
    .digest("hex");

  const stampFile = path.join(installDir, ".stamp");
  const installed = await exists(path.join(installDir, "node_modules", "vite", "package.json"));
  let cached = false;
  try {
    cached = (await readFile(stampFile, "utf8")).trim() === stamp;
  } catch {
    cached = false;
  }

  if (values.force || values.clean || !cached || !installed) {
    log(`[vite ${major}] installing Vite ${version}...`);
    await rm(path.join(installDir, "node_modules"), {
      recursive: true,
      force: true,
    });
    await writeFile(path.join(installDir, "package.json"), packageJsonText);
    await cp(tarball, path.join(installDir, "plugin.tgz"));
    runNpm(
      [
        "install",
        "--no-audit",
        "--no-fund",
        "--no-package-lock",
        "--prefer-offline",
      ],
      { cwd: installDir },
    );
    await writeFile(stampFile, stamp);
  } else {
    log(`[vite ${major}] using cached install`);
  }

  // This shim is what lets the runner import a specific Vite version: the
  // import is resolved from the install directory, not from the repo root.
  await writeFile(
    path.join(installDir, "vite-loader.mjs"),
    'export * from "vite";\n',
  );

  await rm(fixtureDir, { recursive: true, force: true });
  await cp(FIXTURE, fixtureDir, {
    recursive: true,
    filter: (source) =>
      !["node_modules", "dist", ".vite", "package-lock.json"].includes(
        path.basename(source),
      ),
  });
  await writeFile(
    path.join(fixtureDir, "package.json"),
    `${JSON.stringify(
      {
        name: `react-scoped-css-e2e-fixture-vite-${major}`,
        private: true,
        version: "0.0.0",
        type: "module",
        dependencies: { react: REACT, "react-dom": REACT },
        devDependencies: {
          "@vitejs/plugin-react": PLUGIN_REACT,
          vite: version,
        },
      },
      null,
      2,
    )}\n`,
  );

  return { installDir, fixtureDir, version };
}

async function exercise(browser, url, mode, messages) {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#app-button", {
      state: "visible",
      timeout: 30000,
    });

    await expectStyle(page, "#app-button", "backgroundColor", "rgb(0, 128, 0)");
    await expectStyle(page, "#sub-button", "backgroundColor", "rgb(0, 0, 255)");
    await expectStyle(page, ".sub", "color", "rgb(255, 0, 0)");
    await expectStyle(page, "#global-only", "color", "rgb(1, 2, 3)");
    await expectStyle(page, "#app-button", "borderRadius", "8px");
    await expectStyle(page, "#root", "paddingTop", "32px");
    await expectStyle(page, "h1", "fontSize", "51.2px");
    await expectStyle(page, "html", "backgroundColor", "rgb(36, 36, 36)");

    const state = await readDomState(page);
    const hashes = assertScopedApp(state);

    // Give late console/network errors a chance to surface.
    await page.waitForTimeout(250);
    assertDiagnostics(diagnostics, mode);

    return { ...state, ...hashes };
  } finally {
    await context.close();
  }
}

async function runDev({ vite, fixtureDir, version, browser }) {
  const { logger, messages } = makeLogger(vite, `[vite ${version}]`);
  const server = await vite.createServer({
    root: fixtureDir,
    configFile: path.join(fixtureDir, "vite.config.ts"),
    customLogger: logger,
    logLevel: "info",
    css: { devSourcemap: true },
    server: { host: "127.0.0.1", port: 0 },
  });

  try {
    await server.listen();
    await exercise(browser, serverUrl(server), "dev", messages);
    assertViteMessages(messages, { mode: "dev" });
  } finally {
    await server.close();
  }
}

async function runBuild({ vite, fixtureDir, version, browser }) {
  const { logger, messages } = makeLogger(vite, `[vite ${version}]`);

  await vite.build({
    root: fixtureDir,
    configFile: path.join(fixtureDir, "vite.config.ts"),
    customLogger: logger,
    logLevel: "info",
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: true,
      minify: false,
      cssMinify: false,
    },
  });

  const preview = await vite.preview({
    root: fixtureDir,
    configFile: false,
    customLogger: logger,
    logLevel: "info",
    build: { outDir: "dist" },
    preview: { host: "127.0.0.1", port: 0 },
  });

  try {
    await preview.listen?.();
    const state = await exercise(browser, serverUrl(preview), "build", messages);
    await assertBuiltArtifacts({
      fixtureDir,
      state,
      messages,
      allowBrokenSourcemap: values["allow-broken-sourcemap"],
    });

    if (!values["keep-temp"]) {
      await rm(path.join(fixtureDir, "dist"), { recursive: true, force: true });
    }
  } finally {
    await preview.close();
  }
}

async function main() {
  if (values.clean) {
    await rm(CACHE, { recursive: true, force: true });
  }
  await mkdir(PACK_DIR, { recursive: true });

  log("Building the plugin...");
  runNpm(["run", "build"], { cwd: ROOT });

  log("Packing the plugin...");
  const tarball = await packPlugin();
  log(`Using ${path.basename(tarball)}`);

  const browserType = BROWSERS[browserName];
  let browser;
  try {
    browser = await browserType.launch({ headless: !values.headed });
  } catch (error) {
    if (
      /Executable doesn't exist|has not been downloaded|playwright install/i.test(
        String(error),
      )
    ) {
      console.error(
        `\nThe ${browserName} browser is not installed. Run:\n  npm run test:e2e:install\n`,
      );
    }
    throw error;
  }

  const results = [];
  try {
    for (const major of viteMajors) {
      log(`\n=== Vite ${major} ===`);
      const install = await ensureInstall(major, tarball);
      const vite = await import(
        pathToFileURL(path.join(install.installDir, "vite-loader.mjs")).href
      );

      for (const mode of modes) {
        const startedAt = Date.now();
        try {
          if (mode === "dev") {
            await runDev({ vite, browser, ...install });
          } else {
            await runBuild({ vite, browser, ...install });
          }
          results.push({ major, mode, ok: true, ms: Date.now() - startedAt });
          log(`PASS vite ${major} ${mode}`);
        } catch (error) {
          results.push({
            major,
            mode,
            ok: false,
            ms: Date.now() - startedAt,
          });
          log(`FAIL vite ${major} ${mode}`);
          console.error(error);
        }
      }
    }
  } finally {
    await browser.close();
  }

  log("\nResults:");
  for (const result of results) {
    const status = result.ok ? "PASS" : "FAIL";
    log(
      `  ${status}  vite ${result.major} ${result.mode}  (${Math.round(
        result.ms / 1000,
      )}s)`,
    );
  }

  if (results.some((result) => !result.ok)) {
    process.exitCode = 1;
  } else if (!values["keep-temp"]) {
    log("\nAll checks passed. Installs are cached in e2e/.cache.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
