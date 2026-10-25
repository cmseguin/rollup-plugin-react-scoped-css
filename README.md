# rollup-plugin-react-scoped-css

[![npm version](https://img.shields.io/npm/v/rollup-plugin-react-scoped-css.svg?style=flat-square)](https://www.npmjs.com/package/rollup-plugin-react-scoped-css)
[![npm downloads](https://img.shields.io/npm/dm/rollup-plugin-react-scoped-css.svg?style=flat-square)](https://www.npmjs.com/package/rollup-plugin-react-scoped-css)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## Motivations
While using react in a professional context, I realized that it was lacking the scoped css feature that I learned to love from Vue and Angular. After some research I came across good plugins, but sadly were not compatible with vite and/or rollup. Thus, I decided to create this plugin.

## Requirements
+ **node** >= 18
+ **vite** >= 5, or **rollup** >= 4, or **rolldown** >= 1

## How to install

```sh
$ npm i rollup-plugin-react-scoped-css
```

### Simple Configuration

in vite:
```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { reactScopedCssPlugin } from 'rollup-plugin-react-scoped-css'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), reactScopedCssPlugin()]
})
```

without vite (rollup or rolldown):
```js
// rollup.config.js / rolldown.config.js
import { reactScopedCssPlugin } from 'rollup-plugin-react-scoped-css';

// The plugin returns two halves that must run before and after your JSX and
// CSS plugins.
const [scopedCssPre, scopedCssPost] = reactScopedCssPlugin();

export default {
  input: 'src/main.tsx',
  plugins: [scopedCssPre, /* JSX + CSS plugins go here */, scopedCssPost],
};
```

***Notes:** Because this plugin has been built with vite as its primary usecase, it doesn't transpile JSX/TypeScript, LESS, SCSS or other preprocessors, and it doesn't process CSS imports. When you use Rollup or Rolldown directly, you need to plug in those pieces between the two halves of the plugin. See [Using without Vite](#using-without-vite-rollup-and-rolldown) for complete, working configs.*

### Customizing the plugin
There are a few options available to customize how the plugin works
```ts
{
  /**
   * Which files should be included and parsed by the plugin
   * Default: undefined
   */
  include?: FilterPattern;

  /**
   * Which files should be excluded and that should not be parsed by the plugin
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
   * Default: 'v'
   */
  hashPrefix?: string;
}
```

### Using without Vite (Rollup and Rolldown)
The plugin works in two halves:

1. `scopedCssPre` rewrites scoped style imports such as
   `./Component.scoped.css` to `./Component.scoped.css?scope=<hash>`.
2. `scopedCssPost` scopes the CSS and adds the matching `data-<hash>` attributes
   to the compiled React output.

Vite orders these automatically through the `enforce` option. With Rollup or
Rolldown, `enforce` is ignored, so you must place them in the `plugins` array
yourself and put the following between them:

- **JSX/TypeScript transpilation first.** The second half inspects compiled
  `React.createElement()` or `_jsx()` calls, not raw JSX. Babel (shown below) or
  any equivalent transpiler works.
- **A CSS loader/emitter.** Rollup and Rolldown do not process `.css` imports
  on their own. The bridge below reads the file, lets `scopedCssPost` transform
  it, then emits the transformed CSS and replaces the import with an empty
  module.

#### CSS bridge
Save this next to your config. It mirrors the bridge used by the e2e harness:

```js
// scoped-css-bridge.js
import { readFile } from 'node:fs/promises'

const stripQuery = (id) => id.split('?')[0]
const isCss = (id) => stripQuery(id).endsWith('.css')

export function scopedCssBridge() {
  const styles = new Map()

  return [
    {
      name: 'scoped-css:load',
      async load(id) {
        if (isCss(id)) {
          return readFile(stripQuery(id), 'utf8')
        }
      },
    },
    {
      name: 'scoped-css:emit',
      transform(code, id) {
        if (!isCss(id)) return
        styles.set(stripQuery(id), code)
        return { code: 'export default undefined', map: null }
      },
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'styles.css',
          source: [...styles.values()].join('\n'),
        })
      },
    },
  ]
}
```

#### Rollup

```sh
npm i -D rollup @babel/core @babel/preset-react @babel/preset-typescript \
  @rollup/plugin-babel @rollup/plugin-commonjs @rollup/plugin-node-resolve \
  @rollup/plugin-replace
```

```js
// rollup.config.js
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import { reactScopedCssPlugin } from 'rollup-plugin-react-scoped-css'
import { scopedCssBridge } from './scoped-css-bridge.js'

const [scopedCssPre, scopedCssPost] = reactScopedCssPlugin()
const [cssLoader, cssEmitter] = scopedCssBridge()

export default {
  input: 'src/main.tsx',
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: 'main.js',
    sourcemap: true,
  },
  plugins: [
    scopedCssPre,
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      exclude: '**/node_modules/**',
      presets: [
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
    }),
    cssLoader,
    scopedCssPost,
    cssEmitter,
    replace({
      preventAssignment: true,
      values: { 'process.env.NODE_ENV': JSON.stringify('production') },
    }),
    nodeResolve({ extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
    commonjs(),
  ],
}
```

`nodeResolve` and `commonjs` are only needed if React is bundled rather than
loaded externally. `replace` is needed because React's CommonJS build checks
`process.env.NODE_ENV` at runtime.

#### Rolldown

Rolldown resolves node_modules and bundles CommonJS itself, but Babel still has
to run before `scopedCssPost`, and CSS has to be treated as JavaScript for the
bridge to take over.

```sh
npm i -D rolldown @babel/core @babel/preset-react @babel/preset-typescript \
  @rollup/plugin-babel
```

```js
// rolldown.config.js
import { defineConfig } from 'rolldown'
import babel from '@rollup/plugin-babel'
import { reactScopedCssPlugin } from 'rollup-plugin-react-scoped-css'
import { scopedCssBridge } from './scoped-css-bridge.js'

const [scopedCssPre, scopedCssPost] = reactScopedCssPlugin()
const [cssLoader, cssEmitter] = scopedCssBridge()

export default defineConfig({
  input: 'src/main.tsx',
  platform: 'browser',
  // Rolldown no longer bundles CSS itself. The bridge emits it instead.
  moduleTypes: { '.css': 'js' },
  transform: {
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  },
  plugins: [
    scopedCssPre,
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      exclude: '**/node_modules/**',
      presets: [
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
    }),
    cssLoader,
    scopedCssPost,
    cssEmitter,
  ],
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: 'main.js',
    sourcemap: true,
  },
})
```

#### Notes
- Neither Rollup nor Rolldown generates an HTML entry. Load the emitted files
  yourself, for example
  `<link rel="stylesheet" href="./styles.css">` and
  `<script type="module" src="./main.js"></script>`.
- If you use a CSS plugin such as `rollup-plugin-postcss` instead of the bridge,
  make sure it accepts the `?scope=<hash>` query that `scopedCssPre` adds and
  runs between the two halves of the plugin.
- Preprocessors (SCSS, LESS, etc.) still need to run before `scopedCssPost`.
  Compile them to CSS inside the bridge (or add a preprocessor plugin between
  `cssLoader` and `scopedCssPost`) so the scoper receives plain CSS.
- `scopedCssPost` must stay after your JSX transpiler and after the CSS loader,
  and the CSS emitter must stay after `scopedCssPost`.


## Usage

```jsx
// Component.jsx
import './Component.scoped.scss'

export default function Sub() {
  return (
    <div className="wrap">
      <h1>My Component</h1>
    </div>
  )
}
```

```scss
// Component.scoped.scss
.wrap {
  width: 500px;
  h1 { color: red; }
}
```
And just like that the styles will be scoped to the component.

## Limitations
Due to the way this plugin is working, it will apply the scope to the file and not the component individually... This may differ from other frameworks since they don't really let you define multiple components in the same file. This then means that if you have 2 components in the same file, the styles might conflict.

### Deep selector
If you want a selector in scoped styles to be "deep", i.e. affecting child components, you can use the ::deep combinator:
```css
.a::deep .b { /* ... */ }
```
The above will be compiled into:
```css
.a[data-f3f3eg9] .b { /* ... */ }
```
Another expected format, which will generate the same result, is:
```scss
.a::v-deep .b { /* ... */ }
```
This is primarily for backwards compatibility, we recommend the `::deep` selector.
### Dynamically Generated Content
DOM content created with dangerouslySetInnerHTML are not affected by scoped styles, but you can still style them using deep selectors.

### Also Keep in Mind
Scoped styles do not eliminate the need for classes. Due to the way browsers render various CSS selectors, p { color: red } will be many times slower when scoped (i.e. when combined with an attribute selector). If you use classes or ids instead, such as in .example { color: red }, then you virtually eliminate that performance hit.

Be careful with descendant selectors in recursive components! For a CSS rule with the selector .a .b, if the element that matches .a contains a recursive child component, then all .b in that child component will be matched by the rule.

## Testing

### Unit tests

```sh
npm test
```

### End-to-end compatibility harness

The e2e harness packs the plugin with `npm pack`, installs it into isolated
projects, then drives a real browser against each setup:

- **Vite 5, 6, 7, and 8** — the dev server and a production build served with
  `vite preview`.
- **Rollup** — a production build using `@rollup/plugin-babel`, the CSS bridge
  documented above, and the bundled React runtime, served by a static Node
  server.
- **Rolldown** — the same production build and CSS bridge with Rolldown's
  built-in resolver, served the same way.

Prerequisites: Node >= 20.19 and a Playwright browser.

```sh
npm run test:e2e:install   # once; installs Chromium
npm run test:e2e           # all bundlers (Vite matrix + Rollup + Rolldown)
npm run test:e2e:vite      # Vite only
npm run test:e2e:bundlers  # Rollup and Rolldown only
```

Options (pass-through after `--`):

```sh
npm run test:e2e -- --bundler rollup      # vite, rollup, rolldown, or all (default)
npm run test:e2e -- --bundler vite --vite 7   # one Vite major
npm run test:e2e -- --mode dev            # dev, build, or both (Vite only)
npm run test:e2e -- --browser firefox     # chromium (default), firefox, webkit
npm run test:e2e -- --headed              # watch the browser
npm run test:e2e -- --clean --force       # wipe and reinstall cached installs
npm run test:e2e -- --keep-temp           # keep production build output
npm run test:e2e -- --allow-broken-sourcemap
```

`--vite` and `--mode` only affect the Vite matrix. The Rollup and Rolldown
setups run production builds only, so `--mode dev` fails when either is
selected.

The harness asserts that:

- scoped JSX receives `data-<hash>` attributes and every element from a file
  shares that file's hash;
- scoped selectors are applied, global styles stay global, and styles from one
  component do not leak into another;
- computed styles match in Vite dev, Vite production, and the standalone
  bundles;
- emitted CSS contains the scoped selectors and JS contains the matching hash;
- JS sourcemaps reference the original `.tsx` files and include their content;
- there are no page/console/network errors, and Vite runs emit no
  `SOURCEMAP_BROKEN` warnings.

All installs are cached in `e2e/.cache/`; the cache key includes the packed
plugin, so plugin changes trigger a reinstall. Vite 8 uses Rolldown rather than
Rollup; `rollup` is installed in the Vite projects only to satisfy this
package's peer dependency. The `e2e` CI job runs `npm run test:e2e`, covering
all three bundlers.

## Contributing
Anyone is free to open a PR and contribute to this project... just be civilized!


## Credits
Inspired by [react-scoped-css](https://github.com/gaoxiaoliangz/react-scoped-css).