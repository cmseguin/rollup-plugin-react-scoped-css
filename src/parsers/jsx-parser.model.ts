export interface JsxParser {
  isNodeReactElement: (node: any) => boolean;
  isNodeReactFragment: (node: any) => boolean;
  extendNodeWithAttributes: (node: any, attr: string) => any;
}

export enum ParserImplementations {
  new = "new",
  classic = "classic",
}
