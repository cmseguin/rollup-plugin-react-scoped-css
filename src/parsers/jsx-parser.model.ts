export interface JsxParser {
  isNodeReactElement: (node: any) => boolean
  isNodeReactFragment: (node: any) => boolean
  isNode: (node: any) => boolean
  traverse: (ast: any, callback: (ast: any) => void) => void
  findImplementation: (ast: any) => ParserImplementations
  extendNodeWithAttributes: (node: any, attr: string) => any
}

export enum ParserImplementations {
  new = 'new',
  classic = 'classic'
}