import {
  parse,
  generate,
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

type ItemArray = Array<LinkedListNode>;

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

const isPseudoSelector = (item: ListItem<CssNode>) => {
  return (
    item?.data?.type === "PseudoClassSelector" ||
    item?.data?.type === "PseudoElementSelector"
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

        let item = (selector.children as LinkedList).head;

        const itemsToInsertScopeBefore: ItemArray = [];
        let currentChunkIndex = 0;

        while (item !== null) {
          if (isScopePiercingPseudoSelector(item)) {
            Object.assign(item.data, attributeSelector);
            break;
          } else if (isCombinator(item) || isPseudoSelector(item)) {
            currentChunkIndex += 1;
          } else if (item.next) {
            itemsToInsertScopeBefore[currentChunkIndex] = item.next;
          } else {
            selector.children.appendData(attributeSelector);
            break;
          }
          item = item?.next ?? null;
        }

        // This is true if one of the two break statements above was run. Which means we don't want to add to the last one.
        if (itemsToInsertScopeBefore[currentChunkIndex]) {
          itemsToInsertScopeBefore.pop();
        }

        itemsToInsertScopeBefore.forEach((scopePositionItem) => {
          selector.children.insertData(attributeSelector, scopePositionItem);
        });
      });
    });

    return generate(ast);
  } catch (e) {
    console.log(`Failed scoping css of file: ${filename}\n\nError:\n`, e);
    return css;
  }
}
