import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const BROKEN_SOURCEMAP_RE =
  /Sourcemap is likely to be incorrect|Multiple conflicting contents for sourcemap source|SOURCEMAP_BROKEN/i;

export function attachDiagnostics(page) {
  const diagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    httpErrors: [],
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      diagnostics.consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    diagnostics.pageErrors.push(error.message);
  });

  page.on("requestfailed", (request) => {
    const failure = request.failure();
    diagnostics.failedRequests.push(
      `${request.method()} ${request.url()}: ${failure?.errorText ?? "failed"}`,
    );
  });

  page.on("response", (response) => {
    if (response.status() >= 400) {
      diagnostics.httpErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  return diagnostics;
}

export function assertDiagnostics(diagnostics, mode) {
  const describe = (items) => items.map((item) => `  - ${item}`).join("\n");

  assert.equal(
    diagnostics.pageErrors.length,
    0,
    `${mode}: page errors:\n${describe(diagnostics.pageErrors)}`,
  );
  assert.equal(
    diagnostics.consoleErrors.length,
    0,
    `${mode}: console errors:\n${describe(diagnostics.consoleErrors)}`,
  );
  assert.equal(
    diagnostics.httpErrors.length,
    0,
    `${mode}: HTTP errors:\n${describe(diagnostics.httpErrors)}`,
  );
  assert.equal(
    diagnostics.failedRequests.length,
    0,
    `${mode}: failed requests:\n${describe(diagnostics.failedRequests)}`,
  );
}

export function assertViteMessages(messages, { mode, allowBrokenSourcemap }) {
  const errors = messages.filter((message) => message.level === "error");
  assert.equal(
    errors.length,
    0,
    `${mode}: Vite errors:\n${errors.map((message) => `  - ${message.msg}`).join("\n")}`,
  );

  if (mode === "build" && !allowBrokenSourcemap) {
    const broken = messages.filter((message) =>
      BROKEN_SOURCEMAP_RE.test(message.msg),
    );
    assert.equal(
      broken.length,
      0,
      `${mode}: broken sourcemap warning(s):\n${broken
        .map((message) => `  - ${message.msg}`)
        .join("\n")}\n` +
        "Use --allow-broken-sourcemap to triage, or fix the plugin's map chaining.",
    );
  }
}

export async function expectStyle(
  page,
  selector,
  property,
  expected,
  timeout = 10000,
) {
  try {
    await page.waitForFunction(
      ({ selector, property, expected }) => {
        const element = document.querySelector(selector);
        if (!element) {
          return false;
        }
        return getComputedStyle(element)[property] === expected;
      },
      { selector, property, expected },
      { timeout },
    );
  } catch {
    const actual = await page.evaluate(
      ({ selector, property }) => {
        const element = document.querySelector(selector);
        return element ? getComputedStyle(element)[property] : null;
      },
      { selector, property },
    );
    assert.fail(`${selector} ${property}: expected ${expected}, got ${actual}`);
  }
}

export async function readDomState(page) {
  return page.evaluate(() => {
    const hashOf = (element) => {
      if (!element) {
        return null;
      }
      const attributes = element
        .getAttributeNames()
        .filter((name) => /^data-[0-9a-f]+$/i.test(name));
      return attributes.length === 1 ? attributes[0] : attributes;
    };

    const styleText = [...document.styleSheets]
      .map((sheet) => {
        try {
          return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");

    return {
      appAttr: hashOf(document.querySelector("#app-button")),
      subAttr: hashOf(document.querySelector("#sub-button")),
      appRootAttr: hashOf(document.querySelector(".App")),
      subRootAttr: hashOf(document.querySelector(".sub")),
      styleText,
    };
  });
}

export function assertScopedApp(state) {
  const assertHash = (name, value) => {
    assert.equal(
      typeof value,
      "string",
      `${name} should have exactly one data-<hash> attribute, got ${JSON.stringify(value)}`,
    );
    assert.match(value, /^data-[0-9a-f]+$/i, `${name} has an unexpected attribute`);
    return value.slice("data-".length);
  };

  const appHash = assertHash("App button", state.appAttr);
  const subHash = assertHash("Sub button", state.subAttr);

  assert.notEqual(appHash, subHash, "App and Sub should have different hashes");
  assert.equal(
    state.appRootAttr,
    state.appAttr,
    "all App elements should share the App hash",
  );
  assert.equal(
    state.subRootAttr,
    state.subAttr,
    "all Sub elements should share the Sub hash",
  );

  const css = state.styleText;
  assert.ok(
    css.includes(`button[data-${appHash}]`),
    "App scoped button selector should be present",
  );
  assert.ok(
    css.includes(`button[data-${subHash}]`),
    "Sub scoped button selector should be present",
  );
  assert.ok(
    css.includes(`.sub[data-${subHash}]`),
    "Sub scoped .sub selector should be present",
  );
  assert.ok(css.includes("#root"), "global #root selector should be present");
  assert.ok(
    css.includes(".global-only"),
    "global .global-only selector should be present",
  );
  assert.ok(
    !css.includes("#root[data-"),
    "global #root selector must not be scoped",
  );
  assert.ok(
    !css.includes(".global-only[data-"),
    "global .global-only selector must not be scoped",
  );

  return { appHash, subHash };
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files;
}

async function readBundleArtifacts(distDir) {
  const files = await walk(distDir);
  const jsFiles = files.filter((file) => file.endsWith(".js"));
  const cssFiles = files.filter((file) => file.endsWith(".css"));
  const mapFiles = files.filter((file) => file.endsWith(".js.map"));

  assert.ok(jsFiles.length > 0, "expected at least one emitted JS file");
  assert.ok(cssFiles.length > 0, "expected at least one emitted CSS file");
  assert.ok(mapFiles.length > 0, "expected at least one emitted JS sourcemap");

  const js = (
    await Promise.all(jsFiles.map((file) => readFile(file, "utf8")))
  ).join("\n");
  const css = (
    await Promise.all(cssFiles.map((file) => readFile(file, "utf8")))
  ).join("\n");

  return { js, css, mapFiles };
}

function assertBundleContents({ js, css, state }) {
  const { appHash, subHash } = state;
  assert.ok(js.includes(`data-${appHash}`), "JS should contain the App hash");
  assert.ok(js.includes(`data-${subHash}`), "JS should contain the Sub hash");
  assert.ok(
    css.includes(`button[data-${appHash}]`),
    "built CSS should contain the scoped App button selector",
  );
  assert.ok(
    css.includes(`button[data-${subHash}]`),
    "built CSS should contain the scoped Sub button selector",
  );
  assert.ok(
    css.includes(`.sub[data-${subHash}]`),
    "built CSS should contain the scoped .sub selector",
  );
  assert.ok(css.includes("#root"), "built CSS should contain global #root");
  assert.ok(
    css.includes(".global-only"),
    "built CSS should contain global .global-only",
  );
  assert.ok(
    !css.includes("#root[data-"),
    "global #root must not be scoped in built CSS",
  );
  assert.ok(
    !css.includes(".global-only[data-"),
    "global .global-only must not be scoped in built CSS",
  );
}

async function assertSourceMaps(mapFiles) {
  const sources = new Set();
  let sourcesContent = "";
  for (const mapFile of mapFiles) {
    const map = JSON.parse(await readFile(mapFile, "utf8"));
    assert.equal(map.version, 3, `${mapFile} should be a v3 sourcemap`);
    assert.ok(map.mappings, `${mapFile} should have mappings`);
    for (const source of map.sources ?? []) {
      sources.add(String(source).replaceAll("\\", "/"));
    }
    sourcesContent += (map.sourcesContent ?? []).join("\n");
  }

  assert.ok(
    [...sources].some((source) => source.endsWith("App.tsx")),
    `sourcemaps should reference App.tsx, got: ${[...sources].join(", ")}`,
  );
  assert.ok(
    [...sources].some((source) => source.endsWith("Sub.tsx")),
    `sourcemaps should reference Sub.tsx, got: ${[...sources].join(", ")}`,
  );
  assert.ok(
    sourcesContent.includes('className="App"'),
    "sourcemaps should include the original App.tsx JSX in sourcesContent",
  );
}

export async function assertBuiltArtifacts({
  fixtureDir,
  state,
  messages,
  mode = "build",
  allowBrokenSourcemap,
}) {
  const artifacts = await readBundleArtifacts(path.join(fixtureDir, "dist"));
  assertBundleContents({ ...artifacts, state });
  await assertSourceMaps(artifacts.mapFiles);
  assertViteMessages(messages, { mode, allowBrokenSourcemap });
}

/**
 * Assertions for standalone bundlers (Rollup/Rolldown), which emit into
 * `outDir` and have no Vite logger.
 */
export async function assertBundlerArtifacts({ outDir, state }) {
  const artifacts = await readBundleArtifacts(outDir);
  assertBundleContents({ ...artifacts, state });
  await assertSourceMaps(artifacts.mapFiles);
}
