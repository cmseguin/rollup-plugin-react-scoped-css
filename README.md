# rollup-plugin-react-scoped-css

**IMPORTANT: This plugin should *probably* not be used in production... It is in a very early stage**

## Motivations
While using react professionaly I realized that it was lacking the scopped css feature that I learned to love from Vue and Angular. While doing some reasearch I came across good plugins, but sadly were not compatible with vite and rollup. Thus, the reason why I created this plugin which was greatly inspired by the amazing work of [gaoxiaoliangz](https://github.com/gaoxiaoliangz) with his [react-scoped-css plugin](https://github.com/gaoxiaoliangz/react-scoped-css).

## How to install

```sh
npm i rollup-plugin-react-scoped-css
```

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
