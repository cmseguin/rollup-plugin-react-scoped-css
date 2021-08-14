import * as path from 'path';
import { xxHash32 } from 'js-xxhash';
import { createFilter, FilterPattern } from '@rollup/pluginutils';
import { compileStyle } from '@vue/component-compiler-utils'
import { generate } from 'escodegen'

import type { Plugin } from 'rollup'
import { addHashAttributesToJsxTagsAst } from './ast.utils';

const getFilenameFromPath = (filePath: string) => {
  const parts = filePath.split('/')
  return parts[parts.length - 1].split('?')[0]
}

const getHashFromPath = (filePath: string) => {
  const search = '?scope='
  const hash = filePath.slice(filePath.indexOf(search) + search.length)
  return hash
}

const generateHash = (input: string, seed: number = 0) => {
  let hashNum = xxHash32(Buffer.from(input, 'utf8'), seed);
  return hashNum.toString(16);
}

const addAttributesToCss = (src: string, fileName: string, hash: string) => {
  const { code } = compileStyle({
    source: src,
    filename: fileName,
    id: hash,
    scoped: true,
    trim: true,
  })

  return code
}

export interface ReactScopedCssPluginOptions {
  include?: FilterPattern
  exclude?: FilterPattern
  styleFileSuffix?: string
  hashPrefix?: string
}

export interface VitePartialPlugin extends Plugin {
  enforce?: "pre" | "post"
}

export default function reactScopedCssPlugin(optionsIn:ReactScopedCssPluginOptions = {}): VitePartialPlugin[] {
  const options = {
    styleFileSuffix: 'scoped',
    hashPrefix: 'v',
    ...optionsIn
  }

  const filter = createFilter( options.include, options.exclude );
  const scopedCssRegex = new RegExp(`\.${options.styleFileSuffix}\.(scss|css|sass)$`)
  const scopedCssInFileRegex = new RegExp(`\.${options.styleFileSuffix}\.(scss|css|sass)(\"|\')`)
  const jsxRegex = /\.(tsx|jsx)$/

  return [
    {
      name: 'rollup-plugin-react-scoped-css:pre',
      resolveId(source, importer) {
        if (!importer) {
          return;
        }

        if (scopedCssRegex.test(source) && jsxRegex.test(importer)) {
          const importerHash = generateHash(importer);
          const url = path.resolve(path.dirname(importer), `${source}?scope=${importerHash}`)
          return url
        }
      },
      enforce: 'pre'
    },
    {
      name: 'rollup-plugin-react-scoped-css:post',
      transform(code, id) {
        if (!filter(id)) {
          return;
        }

        if (scopedCssInFileRegex.test(code)) {
          const importerHash = generateHash(id);
          const program = this.parse(code)
          const newAst = addHashAttributesToJsxTagsAst(program, `data-${options.hashPrefix}-${importerHash}`)
          return generate(newAst)
        }

        if (scopedCssRegex.test(getFilenameFromPath(id))) {
          const importerHash = getHashFromPath(id);
          return addAttributesToCss(code, getFilenameFromPath(id), `data-${options.hashPrefix}-${importerHash}`)
        }
      }
    }
  ]
}