import { parse, walk, generate, CssNode, findAll, SelectorList, Selector, PseudoElementSelector, AttributeSelector, List } from 'css-tree';

export function scopeCss(css: string, filename: string, hash: string) {
  try {
    const ast = parse(css);
    const attributeSelector: AttributeSelector = {
      type: 'AttributeSelector',
      name: { type: 'Identifier', name: hash },
      matcher: null, value: null, flags: null
    };
    walk(ast, {
      visit: 'SelectorList',
      enter: (selectorList: SelectorList) => {
        walk(selectorList, {
          visit: 'Selector',
          enter: (selector: Selector) => {
            const results = findAll(selector, (node: CssNode) =>
              node.type === 'PseudoElementSelector' &&
              (node.name === 'v-deep' || node.name === 'deep')
            );
            if(results.length > 0) {
              results.map((node: CssNode) => {
                //@ts-ignore: optimization hack, we need to override the object without changing the reference.
                node.children = undefined;
                node.loc = undefined;
                Object.assign(node, attributeSelector);
              });
            } else {
              const children: List<CssNode> = selector.children;
              children.appendData(attributeSelector);
            }
          }
        })
      }
    });

    return generate(ast);

  } catch (e) {
    console.log(`Failed scoping css of file: ${filename}\n\nError:\n`, e);
    return css;
  }
}
