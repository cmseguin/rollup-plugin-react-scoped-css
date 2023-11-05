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

    const selectorLists = ast.children.reduce(
      (acc: Array<SelectorList>, node) => {
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
      },
      []
    );

    selectorLists.map((selectorList: SelectorList) => {
      selectorList.children.forEach((selector) => {
        if (selector.type === "Selector") {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Head is not exposed via @types/css-tree but does exist.
          let item = selector.children.head;
          let hasHitDeep = false;
          while (item !== null) {
            if (
              item?.next?.data?.type === "PseudoElementSelector" &&
              (item?.next?.data?.name === "v-deep" ||
                item?.next?.data?.name === "deep")
            ) {
              hasHitDeep = true;
              item.next.children = undefined;
              item.next.loc = undefined;
              Object.assign(item.next.data, attributeSelector);

              if (!item.next) {
                break;
              }

              item = item?.next ?? null;
            }

            if (hasHitDeep) {
              break;
            }

            if (item?.data?.type === "Combinator") {
              item = item?.next ?? null;
              continue;
            }

            if (
              (item?.data?.type === "TypeSelector" ||
                item?.data?.type === "ClassSelector") &&
              item?.next?.data?.type === "ClassSelector"
            ) {
              item = item?.next ?? null;
              continue;
            }

            item = item?.next ?? null;
            selector.children.insertData(attributeSelector, item);
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
