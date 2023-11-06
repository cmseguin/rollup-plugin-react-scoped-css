import {
  parse,
  generate,
  SelectorList,
  AttributeSelector,
  StyleSheet,
  CssNode,
  ListItem,
} from "css-tree";

export function scopeCss(css: string, filename: string, hash: string) {
  try {
    const ast = parse(css) as StyleSheet;

    const isScopePiercingPseudoSelector = (item: ListItem<CssNode>) => {
      return (
        item?.data?.type === "PseudoElementSelector" &&
        (item?.data?.name === "v-deep" || item?.data?.name === "deep")
      );
    };

    const isScopedAttributeSelector = (item: ListItem<CssNode>) => {
      return (
        item?.data?.type === "AttributeSelector" &&
        item?.data?.name?.name === hash
      );
    };

    const isChainedSelector = (item: ListItem<CssNode>) => {
      return (
        (item?.data?.type === "TypeSelector" ||
          item?.data?.type === "ClassSelector" ||
          item?.data?.type === "AttributeSelector") &&
        (item?.next?.data?.type === "ClassSelector" ||
          item?.next?.data?.type === "AttributeSelector")
      );
    };

    const isCombinator = (item: ListItem<CssNode>) => {
      return item?.data?.type === "Combinator";
    };

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
          let item: ListItem<CssNode> | null = selector.children.head;
          let hasHitDeep = false;
          while (item !== null) {
            if (isScopedAttributeSelector(item)) {
              item = item?.next ?? null;
              continue;
            }

            if (hasHitDeep) {
              break;
            }

            if (item.next && isScopePiercingPseudoSelector(item.next)) {
              hasHitDeep = true;
              Object.assign(item.next.data, attributeSelector);
              break;
            }

            if (item?.data?.type === "Combinator") {
              item = item?.next ?? null;
              continue;
            }

            if (isChainedSelector(item)) {
              item = item?.next ?? null;
              continue;
            }

            if (item?.next === null) {
              selector.children.appendData(attributeSelector);
            } else {
              selector.children.insertData(attributeSelector, item.next);
            }

            item = item?.next ?? null;
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
