# rollup-plugin-react-scoped-css

[![npm version](https://img.shields.io/npm/v/rollup-plugin-react-scoped-css.svg?style=flat-square)](https://www.npmjs.com/package/rollup-plugin-react-scoped-css)
[![npm downloads](https://img.shields.io/npm/dm/rollup-plugin-react-scoped-css.svg?style=flat-square)](https://www.npmjs.com/package/rollup-plugin-react-scoped-css)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## Motivations
While using react in a professional context, I realized that it was lacking the scoped css feature that I learned to love from Vue and Angular. After some research I came across good plugins, but sadly were not compatible with vite and/or rollup. Thus, I decided to create this plugin.

## Requirements
+ **node** >= 18
+ **vite** >= 5

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

in rollup:
```js
// rollup.config.js
import { reactScopedCssPlugin } from 'rollup-plugin-react-scoped-css';

export default {
  input: 'src/input.js',
  output: { file: 'ouput.js' },
  plugins: [ reactScopedCssPlugin() ]
};
```

***Notes:** Because this plugin has been built with vite as its primary usecase, it doesn't transpile LESS, SCSS or other preprocessors. For that reason, you will likely need to add your transpilation plugins before reactScopedCssPlugin if you plan on using this without vite.*

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

### Advanced Rollup usecases
Since this plugin works in two parts, you might need to expose the first part, then add any other plugin, and then expose the second part of the plugin. This part is automatically handled with vite thanks to the enforce attribute.

```js
const reactScopedPlugins = reactScopedCssPlugin()
export default {
  //...
  plugins: [ reactScopedPlugins[0], {...stylingPlugins}, reactScopedPlugins[1] ]
};
```

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

### End-to-end Vite compatibility harness

The e2e harness packs the plugin with `npm pack`, installs it into an isolated
project for each Vite major, then drives Chromium against both the dev server
and a production build served with `vite preview`.

Prerequisites: Node >= 20.19 and a Playwright browser.

```sh
npm run test:e2e:install   # once; installs Chromium
npm run test:e2e           # Vite 5, 6, 7, and 8; dev + build/preview
```

Options (pass-through after `--`):

```sh
npm run test:e2e -- --vite 7              # one major (repeatable/comma-separated)
npm run test:e2e -- --mode dev            # dev, build, or both (default)
npm run test:e2e -- --browser firefox     # chromium (default), firefox, webkit
npm run test:e2e -- --headed              # watch the browser
npm run test:e2e -- --clean --force       # wipe and reinstall cached installs
npm run test:e2e -- --keep-temp           # keep production build output
npm run test:e2e -- --allow-broken-sourcemap
```

The harness asserts that:

- scoped JSX receives `data-<hash>` attributes and every element from a file
  shares that file's hash;
- scoped selectors are applied, global styles stay global, and styles from one
  component do not leak into another;
- computed styles match in both dev and production builds;
- emitted CSS contains the scoped selectors and JS contains the matching hash;
- JS sourcemaps reference the original `.tsx` files and include their content;
- there are no page/console/network errors and no `SOURCEMAP_BROKEN` warnings.

Vite installs are cached in `e2e/.cache/`; the cache key includes the packed
plugin, so plugin changes trigger a reinstall. Vite 8 uses Rolldown rather than
Rollup; `rollup` is installed in the harness only to satisfy this package's peer
dependency. No CI workflow runs the e2e harness yet — it is a local script.

## Contributing
Anyone is free to open a PR and contribute to this project... just be civilized!


## Credits
Inspired by [react-scoped-css](https://github.com/gaoxiaoliangz/react-scoped-css).