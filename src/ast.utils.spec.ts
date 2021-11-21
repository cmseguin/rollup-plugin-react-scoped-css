import { resolve } from 'path'
import { readFile } from 'fs/promises'
import { parse } from 'acorn'
import { generate } from 'escodegen'
import { addHashAttributesToJsxTagsAst } from './ast.utils'

describe('Clasic AST Utils', () => {
  it('Should add the attr to the right elements', async () => {
    const compiled = await readFile(resolve(__dirname, './__mocks__/classic-compiled-jsx.js'), { encoding: 'utf-8' })
    const compiledWithAttr = await readFile(resolve(__dirname, './__mocks__/classic-compiled-jsx-with-attr.js'), { encoding: 'utf-8' })
    const ast = parse(compiled, { ecmaVersion: 2021, sourceType: "module" })
    const modifiedAst = addHashAttributesToJsxTagsAst(ast, 'data-v-123456')
    const modifiedCompiled = generate(modifiedAst, { format: {
      indent: {
        style: '  ',
      },
      quotes: 'double',
    } })

    expect(modifiedCompiled).toEqual(compiledWithAttr)
  })
})