# rollup-plugin-react-scoped-css

## Motivations
While using react in a professional context, I realized that it was lacking the scopped css feature that I learned to love from Vue and Angular. After some reasearch I came across good plugins, but sadly were not compatible with vite and/or rollup. Thus, I decided to create this plugin which was greatly inspired by the amazing work of [gaoxiaoliangz](https://github.com/gaoxiaoliangz) with his [react-scoped-css plugin](https://github.com/gaoxiaoliangz/react-scoped-css).

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

## Technicality
since this plugin uses the engine of vue to scope the css to the components, the following sections come straight from the [vue documentation](https://vue-loader.vuejs.org/guide/scoped-css.html#deep-selectors).

### Deep selector
If you want a selector in scoped styles to be "deep", i.e. affecting child components, you can use the >>> combinator:
```css
.a >>> .b { /* ... */ }
```
The above will be compiled into:
```css
.a[data-v-f3f3eg9] .b { /* ... */ }
```
Some pre-processors, such as Sass, may not be able to parse >>> properly. In those cases you can use the /deep/ or ::v-deep combinator instead - both are aliases for >>> and work exactly the same. Based on the example above these two expressions will be compiled to the same output:
```scss
.a::v-deep .b { /* ... */ }
/* or */
.a /deep/ .b { /* ... */ }
```
### Dynamically Generated Content
DOM content created with dangerouslySetInnerHTML are not affected by scoped styles, but you can still style them using deep selectors.

### Also Keep in Mind
Scoped styles do not eliminate the need for classes. Due to the way browsers render various CSS selectors, p { color: red } will be many times slower when scoped (i.e. when combined with an attribute selector). If you use classes or ids instead, such as in .example { color: red }, then you virtually eliminate that performance hit.

Be careful with descendant selectors in recursive components! For a CSS rule with the selector .a .b, if the element that matches .a contains a recursive child component, then all .b in that child component will be matched by the rule.

## How to install

```sh
$ npm i rollup-plugin-react-scoped-css
```

### Simple Configuration

in vite:
```js
// vite.config.js
import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import reactScopedCssPlugin from 'rollup-plugin-react-scoped-css'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh(), reactScopedCssPlugin()]
})
```

in rollup:
```js
// rollup.config.js
import reactScopedCssPlugin from 'rollup-plugin-react-scoped-css';

export default {
  input: 'src/input.js',
  output: { file: 'ouput.js' },
  plugins: [ reactScopedCssPlugin() ]
};
```

### Customizing the plugin
There are a few options available to customize how the plugin works
```ts
{
  /**
   * Which files should be included and parsed by the plugin
   * Default: undefined
   */
  include?: FilterPattern

  /**
   * Which files should be exluded and that should not be parsed by the plugin
   * Default: undefined
   */
  exclude?: FilterPattern

  /**
   * If you want to customize the stylesheet file pattern
   * if undefined or '' is passed, all files will be evaluated
   * Default: 'scoped'
   */
  styleFileSuffix?: string

  /**
   * If you want to customize the attribute prefix that is added to the jsx elements
   * Default: 'v'
   */
  hashPrefix?: string

  /**
   * If you want to customize the preprocessors
   * Default: ['scss', 'css', 'sass', 'less']
   */
  styleFileExtensions?: string[]

  /**
   * If you have jsx in other file extensions
   * Default: ['jsx', 'tsx']
   */
  jsxFileExtensions?: string[]
}
```

### With other rollup plugins
Since this plugin works in two parts, you might need to expose the first part, then add any other plugin, and then expose the second part of the plugin. This part is automatically handled with vite thanks to the enforce attribute.

```js
const reactScopedPlugins = reactScopedCssPlugin()
export default {
  //...
  plugins: [ reactScopedPlugins[0], {...stylingPlugins}, reactScopedPlugins[1] ]
};
```

## Contributing
Anyone is free to open a PR and contribute to this project... just be civilized!