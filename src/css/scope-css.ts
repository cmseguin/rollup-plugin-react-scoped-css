import {
  parse,
  generate,
  SelectorList,
  AttributeSelector,
  StyleSheet,
  CssNode,
  ListItem,
  List,
} from "css-tree";

/**
 * This is needed because css-tree doesn't expose the linked list properties,
 * but this makes it way easier to traverse the list while knowing which element comes next and previous.
 */
interface LinkedListNode<T = CssNode> {
  prev: LinkedListNode<T> | null;
  next: LinkedListNode<T> | null;
  data: T;
}
interface LinkedList<T = CssNode> extends List<T> {
  head: LinkedListNode<T> | null;
  tail: LinkedListNode<T> | null;
}

const getSelectors = (items: List<CssNode>): LinkedList[] => {
  const selectorLists = items.reduce((acc, node) => {
    if (node.type === "Rule" && node?.prelude?.type === "SelectorList") {
      acc.push(node.prelude.children as LinkedList);
    } else if (node.type === "Atrule" && node.name === "media") {
      node.block?.children.forEach((rule) => {
        if (rule.type === "Atrule" && rule.name === "media") {
          const selectors = getSelectors(rule.block?.children as List<CssNode>);
          acc.push(...selectors);
        }
        if (rule.type === "Rule" && rule.prelude.type === "SelectorList") {
          acc.push(rule.prelude.children as LinkedList);
        }
      });
    }
    return acc;
  }, [] as LinkedList[]);

  return selectorLists;
};

const isScopePiercingPseudoSelector = (item: ListItem<CssNode>) => {
  return (
    item?.data?.type === "PseudoElementSelector" &&
    (item?.data?.name === "v-deep" || item?.data?.name === "deep")
  );
};

const isScopedAttributeSelector = (item: ListItem<CssNode>, hash: string) => {
  return (
    item?.data?.type === "AttributeSelector" && item?.data?.name?.name === hash
  );
};

const isChainedSelector = (item: ListItem<CssNode>) => {
  return (
    (item?.data?.type === "TypeSelector" ||
      item?.data?.type === "ClassSelector" ||
      item?.data?.type === "AttributeSelector" ||
      item?.data?.type === "IdSelector") &&
    (item?.next?.data?.type === "ClassSelector" ||
      item?.next?.data?.type === "AttributeSelector" ||
      item?.next?.data?.type === "IdSelector")
  );
};

const isCombinator = (item: ListItem<CssNode>) => {
  return item?.data?.type === "Combinator";
};

export function scopeCss(css: string, filename: string, hash: string) {
  try {
    const ast = parse(css) as StyleSheet;
    const selectorLists = getSelectors(ast.children);

    const attributeSelector: AttributeSelector = {
      type: "AttributeSelector",
      name: { type: "Identifier", name: hash },
      matcher: null,
      value: null,
      flags: null,
    };

    selectorLists.forEach((selectorList) => {
      selectorList.forEach((selector) => {
        if (selector.type !== "Selector") {
          return;
        }

        let hasHitDeep = false;
        let item = (selector.children as LinkedList).head;

        while (item !== null || hasHitDeep) {
          // Only to satisfy typescript
          if (item === null) {
            break;
          }

          if (isScopedAttributeSelector(item, hash)) {
            item = item?.next ?? null;
            continue;
          }

          if (item.next && isScopePiercingPseudoSelector(item.next)) {
            hasHitDeep = true;
            Object.assign(item.next.data, attributeSelector);
            break;
          }

          if (isChainedSelector(item) || isCombinator(item)) {
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
      });
    });

    return generate(ast);
  } catch (e) {
    console.log(`Failed scoping css of file: ${filename}\n\nError:\n`, e);
    return css;
  }
}
