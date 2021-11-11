# rollup-plugin-react-scoped-css

**IMPORTANT: This plugin is still in its early phase, use at your own risk, but feel free to contribute.**

## Motivations
While using react in a professional context, I realized that it was lacking the scopped css feature that I learned to love from Vue and Angular. After some reasearch I came across good plugins, but sadly were not compatible with vite and/or rollup. Thus, I decided to create this plugin which was greatly inspired by the amazing work of [gaoxiaoliangz](https://github.com/gaoxiaoliangz) with his [react-scoped-css plugin](https://github.com/gaoxiaoliangz/react-scoped-css).

## How to install

```sh
npm i rollup-plugin-react-scoped-css
```

### Simple Configuration

in vite:
```
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
```
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
```
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
  preProcessors?: string[]
}
```

### With other rollup plugins
Since this plugin works in two parts, you might need to expose the first part, then add any styling plugin, and then expose the second part of the plugin. This part is automatically handled with vite thanks to the enforce attribute.

```
const reactScopedPlugins = reactScopedCssPlugin()
export default {
  //...
  plugins: [ reactScopedPlugins[0], {...stylingPlugins}, reactScopedPlugins[1] ]
};
```

## Contributing
Anyone is free to open a PR and contribute to this project... I, by no means, am the best, and I am sure someone smarter than me can bring a lot to this project. 

The only rules is: Don't be a dick