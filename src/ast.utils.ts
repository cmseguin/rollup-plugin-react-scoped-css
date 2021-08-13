function isNode(obj: unknown) {
  return typeof obj === 'object' && 
      typeof (obj as any)?.end === 'number' && 
      typeof (obj as any)?.start === 'number' && 
      typeof (obj as any)?.type === 'string'
}

function traverse(ast: any, callback: Function) {
  for (let key of Object.keys(ast)) {
    if (['end', 'start', 'type'].includes(key)) { continue; }

    if (Array.isArray(ast[key])) {
      for (let nodeIndex in ast[key]) {
        ast[key][nodeIndex] = traverse(ast[key][nodeIndex], callback)
      }
    } else if(isNode(ast[key])) {
      ast[key] = traverse(ast[key], callback)
    }
  }

  const result = callback(ast);

  return typeof result !== 'undefined' ? result : ast
}

export function addHashAttributesToJsxTagsAst(program: any, attr: string) {
  const newNode = {
    type: 'Property',
    method: false,
    shorthand: false,
    computed: false,
    key: {
      type: 'Identifier',
      name: `'${attr}'`
    },
    value: {
      type: 'Literal',
      value: true,
      raw: "true"
    },
    kind: 'init'
  }
  return traverse(program, (x: any) => {
    if (
        x?.type === 'CallExpression' && 
        x?.callee?.object?.name === 'React' &&
        x?.callee?.property?.name === 'createElement'
    ) {
      const arg = x?.arguments?.[1]
      return {
        ...x,
        arguments: x?.arguments.map((v: any, i: number) => {
          if (i === 1) {
              if (v.type === 'ObjectExpression') {
                return {
                  ...v,
                  properties: [
                    ...arg.properties,
                    newNode
                  ]
                }
              } else {
                return {
                  type: 'ObjectExpression',
                  properties: [newNode]
                }
              }
              
            }
            return v
          })
        }
    }
  })
}