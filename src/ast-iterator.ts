
const isNode = (obj: any) => {
  return typeof obj === 'object' && 
      typeof (obj as any)?.end === 'number' && 
      typeof (obj as any)?.start === 'number' && 
      typeof (obj as any)?.type === 'string'
}

export const astIterator = function* (ast: any): IterableIterator<any> {
  if (!ast) { return }

  for (let key of Object.keys(ast)) {
    // Skip useless keys
    if (['end', 'start', 'type'].includes(key)) { continue; }

    // If key value is an array, iterate over it
    if (Array.isArray(ast[key])) {
      for (let nodeIndex in ast[key]) {
        yield *astIterator(ast[key][nodeIndex])
      }
    } else if(isNode(ast[key])) {
      yield *astIterator(ast[key])
    }
  }

  yield ast
}