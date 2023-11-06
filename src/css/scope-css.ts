import {
  parse,
  generate,
  CssNode,
  findAll,
  SelectorList,
  AttributeSelector,
  StyleSheet,
} from "css-tree";

export function scopeCss(css: string, filename: string, hash: string) {
  try {
    const ast = parse(css) as StyleSheet;
    const attributeSelector: AttributeSelector = {
      type: "AttributeSelector",
      name: { type: "Identifier", name: hash },
      matcher: null,
      value: null,
      flags: null,
    };

    const selectorLists = ast.children.reduce((acc: Array<SelectorList>, node) => {
      if (node.type === "Rule") {
        if (node?.prelude?.type === "SelectorList") {
          acc.push(node.prelude as SelectorList);
        }
      } else if (node.type === "Atrule" && node.name === "media") {
        node.block?.children.map((rule) => {
          if (rule.type === "Rule" && rule.prelude.type === "SelectorList") {
            acc.push(rule.prelude as SelectorList);
          }
        });
      }
      return acc;
    }, []);

    selectorLists.map((selectorList: SelectorList) => {
      selectorList.children.forEach((selector) => {
        if (selector.type === "Selector") {
          const results = findAll(
            selector,
            (node: CssNode) =>
              node.type === "PseudoElementSelector" &&
              (node.name === "v-deep" || node.name === "deep")
          );
          if (results.length > 0) {
            results.map((node: CssNode) => {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              //@ts-ignore: optimization hack, we need to override the object without changing the reference.
              node.children = undefined;
              node.loc = undefined;
              Object.assign(node, attributeSelector);
            });
          } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: Tail is not exposed via @types/css-tree but does exist.
            let item = selector.children.tail;
            while (
              item !== null &&
              (item?.data?.type === "PseudoClassSelector" ||
                item?.data?.type === "PseudoElementSelector" ||
                item?.data?.type === "Combinator")
            ) {
              item = item.prev;
            }
            selector.children.insertData(attributeSelector, item.next);
          }
        }
      });
    });

    return generate(ast);
  } catch (e) {
    console.log(`Failed scoping css of file: ${filename}\n\nError:\n`, e);
    return css;
  }
}
