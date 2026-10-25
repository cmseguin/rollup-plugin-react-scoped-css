import {
  parse,
  generate,
  AttributeSelector,
  StyleSheet,
  CssNode,
  List,
  Raw,
  Rule,
  Selector,
  PseudoClassSelector,
  SelectorList,
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

type Item = LinkedListNode<CssNode>;

/**
 * Keyframe selectors (`from`, `to`, `50%`) are also parsed as `Rule` nodes with
 * a `SelectorList` prelude. They need to be left alone, otherwise animations
 * break by becoming e.g. `0%[data-hash]`.
 */
const isKeyframesAtRule = (name: string) =>
  /^(-[a-z0-9]+-)?keyframes$/i.test(name);

const isScopePiercingPseudoSelector = (node: CssNode) =>
  node.type === "PseudoElementSelector" &&
  (node.name === "v-deep" || node.name === "deep");

/**
 * CSS-tree parses the contents of `:deep(...)` as a `Raw` node, unlike
 * `:is()`/`:where()` which it parses as selectors.
 */
const isDeepFunctionSelector = (node: CssNode): node is PseudoClassSelector =>
  node.type === "PseudoClassSelector" &&
  (node.name === "deep" || node.name === "v-deep") &&
  !!node.children;

/**
 * Pseudo selectors that refer to the document root. They cannot be scoped
 * because the root element never receives the scope attribute, so adding the
 * attribute would only turn working rules into dead ones.
 */
const isRootLikePseudoSelector = (node: CssNode) =>
  node.type === "PseudoClassSelector" &&
  (node.name.toLowerCase() === "root" || node.name.toLowerCase() === "scope");

/**
 * The `::view-transition-*` tree is rooted at the document root, which never
 * receives the scope attribute. A bare occurrence can therefore never match
 * once scoped, so it is left global just like `:root`.
 */
const isViewTransitionPseudoElement = (node: CssNode) =>
  node.type === "PseudoElementSelector" &&
  node.name.toLowerCase().startsWith("view-transition");

const isCombinator = (node: CssNode) => node.type === "Combinator";

const isNestingSelector = (node: CssNode) => node.type === "NestingSelector";

/**
 * Simple selectors that can receive the scope attribute. `&` is excluded
 * because the parent rule is already scoped, so `&[hash]` would be redundant.
 */
const isHashableSelector = (node: CssNode) =>
  node.type === "TypeSelector" ||
  node.type === "ClassSelector" ||
  node.type === "IdSelector" ||
  node.type === "AttributeSelector";

const getDeepFunctionSelectorText = (
  node: PseudoClassSelector,
): string | null => {
  const children = node.children as List<CssNode> | null;
  if (!children || children.isEmpty) {
    return null;
  }

  let text = "";
  children.forEach((child) => {
    if (child.type === "Raw") {
      text += child.value;
    }
  });

  return text || null;
};

/**
 * Splits a raw selector prelude on top-level `||` (column combinator) while
 * ignoring `||` inside attribute selectors, functional pseudos, or strings.
 */
const splitOnColumnCombinator = (value: string): string[] => {
  const parts: string[] = [];
  let start = 0;
  let parenthesisDepth = 0;
  let bracketDepth = 0;
  let quote: string | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (quote) {
      if (char === "\\") {
        index += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "\\") {
      index += 1;
    } else if (char === "(") {
      parenthesisDepth += 1;
    } else if (char === ")") {
      parenthesisDepth -= 1;
    } else if (char === "[") {
      bracketDepth += 1;
    } else if (char === "]") {
      bracketDepth -= 1;
    } else if (
      char === "|" &&
      value[index + 1] === "|" &&
      parenthesisDepth === 0 &&
      bracketDepth === 0
    ) {
      parts.push(value.slice(start, index));
      index += 1;
      start = index + 1;
    }
  }

  parts.push(value.slice(start));
  return parts;
};

export interface ScopedCssResult {
  code: string;
  map: string | null;
}

export function scopeCss(
  css: string,
  filename: string,
  hash: string,
  source = filename,
): ScopedCssResult {
  try {
    const ast = parse(css, { positions: true, filename: source }) as StyleSheet;

    const attributeSelector: AttributeSelector = {
      type: "AttributeSelector",
      name: { type: "Identifier", name: hash },
      matcher: null,
      value: null,
      flags: null,
    };

    const scopeSelectorList = (selectorLists: LinkedList) => {
      selectorLists.forEach((selector) => {
        if (selector.type === "Selector") {
          scopeSelector(selector as Selector);
        }
      });
    };

    /**
     * Inserts the scope attribute after every consecutive run of simple
     * selectors. Pseudo selectors break a run, which preserves the previous
     * behaviour of `a:hover.b` becoming `a[hash]:hover.b[hash]`.
     */
    const scopeRuns = (items: Item[], selectorChildren: LinkedList) => {
      let run: Item[] = [];

      const flushRun = () => {
        if (run.length === 0) {
          return;
        }

        const last = run[run.length - 1];
        if (last.next) {
          selectorChildren.insertData(attributeSelector, last.next);
        } else {
          selectorChildren.appendData(attributeSelector);
        }
        run = [];
      };

      items.forEach((item) => {
        if (isHashableSelector(item.data)) {
          run.push(item);
        } else {
          flushRun();
        }
      });

      flushRun();
    };

    const scopeCompound = (items: Item[], selectorChildren: LinkedList) => {
      if (items.length === 0) {
        return;
      }

      if (items.some((item) => isHashableSelector(item.data))) {
        scopeRuns(items, selectorChildren);
        return;
      }

      // `&` is already scoped through its parent rule.
      if (items.some((item) => isNestingSelector(item.data))) {
        return;
      }

      // `:root` / `:scope` refer to the document root and can never match the
      // scope attribute; leave them global.
      if (items.some((item) => isRootLikePseudoSelector(item.data))) {
        return;
      }

      // Bare view-transition pseudo-elements are also rooted at the document
      // root, so scoping them would only produce an unmatchable selector.
      if (items.some((item) => isViewTransitionPseudoElement(item.data))) {
        return;
      }

      if (items.some((item) => item.data.type === "PseudoElementSelector")) {
        // An attribute cannot follow a pseudo-element, so it has to be
        // prepended: `::before` -> `[hash]::before`.
        selectorChildren.insertData(attributeSelector, items[0]);
        return;
      }

      if (!items.some((item) => item.data.type === "PseudoClassSelector")) {
        return;
      }

      // `:hover` -> `:hover[hash]`
      const last = items[items.length - 1];
      if (last.next) {
        selectorChildren.insertData(attributeSelector, last.next);
      } else {
        selectorChildren.appendData(attributeSelector);
      }
    };

    const replaceDeepFunction = (selectorChildren: LinkedList, item: Item) => {
      const node = item.data as PseudoClassSelector;
      const selectorText = getDeepFunctionSelectorText(node);

      if (!selectorText) {
        return;
      }

      let parsed: SelectorList;
      try {
        parsed = parse(selectorText, {
          context: "selectorList",
        }) as SelectorList;
      } catch {
        return;
      }

      const selectors = parsed.children as List<Selector>;

      if (selectors.size === 1) {
        // Splice the argument selector in place of `:deep(...)`.
        const replacement = new List<CssNode>();
        (selectors.first as Selector).children.forEach((child) => {
          replacement.appendData(child);
        });
        selectorChildren.replace(item, replacement);
      } else {
        // A selector list cannot be spliced into a single selector, but
        // `:is(...)` has the same matching semantics here.
        node.name = "is";
        node.children = new List<CssNode>();
        node.children.appendData(parsed);
      }
    };

    const scopeSelector = (selector: Selector) => {
      const selectorChildren = selector.children as LinkedList;
      const compounds: Item[][] = [];
      let compound: Item[] = [];

      for (let item = selectorChildren.head; item !== null; item = item.next) {
        if (isCombinator(item.data)) {
          compounds.push(compound);
          compound = [];
        } else {
          compound.push(item);
        }
      }
      compounds.push(compound);

      for (const items of compounds) {
        const piercingIndex = items.findIndex(
          (item) =>
            isScopePiercingPseudoSelector(item.data) ||
            isDeepFunctionSelector(item.data),
        );

        if (piercingIndex !== -1) {
          const piercingItem = items[piercingIndex];

          if (isDeepFunctionSelector(piercingItem.data)) {
            // Scope everything before `:deep(...)` in the same compound,
            // then splice in the (unscoped) argument selector.
            scopeRuns(items.slice(0, piercingIndex), selectorChildren);
            replaceDeepFunction(selectorChildren, piercingItem);
          } else {
            // Replace `::deep` / `::v-deep` with the scope attribute.
            Object.assign(piercingItem.data, attributeSelector);
          }

          // Everything after a deep selector stays global.
          return;
        }

        scopeCompound(items, selectorChildren);
      }
    };

    /**
     * CSS-tree parses implicit nesting as a `Raw` node inside the parent
     * rule. Re-parse it as a rule so its selector can be scoped and write the
     * transformed rule back.
     */
    const scopeRawNestedRule = (node: Raw) => {
      if (!node.value.includes("{")) {
        return;
      }

      try {
        const rule = parse(node.value, { context: "rule" }) as Rule;

        if (rule.type !== "Rule") {
          return;
        }

        scopeRule(rule);
        node.value = generate(rule);
      } catch {
        // Leave constructs css-tree cannot parse untouched.
      }
    };

    const scopeRawSelectorPrelude = (prelude: Raw) => {
      const parts = splitOnColumnCombinator(prelude.value);

      if (parts.length === 1) {
        return;
      }

      try {
        const scopedParts = parts.map((part) => {
          const selectorList = parse(part.trim(), {
            context: "selectorList",
          }) as SelectorList;
          scopeSelectorList(selectorList.children as LinkedList);
          return generate(selectorList);
        });

        prelude.value = scopedParts.join(" || ");
      } catch {
        // Leave constructs css-tree cannot parse untouched.
      }
    };

    const scopeNodes = (children: List<CssNode>, insideRule: boolean) => {
      children.forEach((node) => {
        if (node.type === "Rule") {
          scopeRule(node);
        } else if (
          node.type === "Atrule" &&
          node.block &&
          !isKeyframesAtRule(node.name)
        ) {
          // Recurse into conditional/group at-rules (`@media`, `@container`,
          // `@supports`, `@layer`, `@scope`, etc.) so their rules get scoped.
          scopeNodes(node.block.children, insideRule);
        } else if (insideRule && node.type === "Raw") {
          scopeRawNestedRule(node);
        }
      });
    };

    const scopeRule = (rule: Rule) => {
      if (rule.prelude?.type === "SelectorList") {
        scopeSelectorList(rule.prelude.children as LinkedList);
      } else if (rule.prelude?.type === "Raw") {
        scopeRawSelectorPrelude(rule.prelude);
      }

      if (rule.block) {
        // Nested rules (`& ...`) and nested at-rules live in the rule block.
        scopeNodes(rule.block.children, true);
      }
    };

    scopeNodes(ast.children, false);

    const { css: scopedCss, map } = generate(ast, {
      sourceMap: true,
    }) as unknown as { css: string; map: { toString(): string } };

    return { code: scopedCss, map: map.toString() };
  } catch (e) {
    console.log(`Failed scoping css of file: ${filename}\n\nError:\n`, e);
    return { code: css, map: null };
  }
}
