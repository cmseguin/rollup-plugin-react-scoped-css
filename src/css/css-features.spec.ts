import { parse, generate } from "css-tree";
import { scopeCss } from "./scope-css";

const HASH = "data-123456";

const validateCss = (inputCss: string, expectedScopedCss: string) => {
  const result = scopeCss(inputCss, "test.scoped.css", HASH);
  const expectedResult = generate(parse(expectedScopedCss));

  expect(result.code).toBe(expectedResult);
};

type FeatureCase = [name: string, input: string, expected: string];

/**
 * CSS features the scoper handles correctly today. These are normal
 * assertions, so a regression in any of them fails the suite.
 */
const supported: FeatureCase[] = [
  // ---------------------------------------------------------------------
  // Simple selectors
  // ---------------------------------------------------------------------
  ["type selector", "div { color: red; }", "div[data-123456] { color: red; }"],
  ["class selector", ".a { color: red; }", ".a[data-123456] { color: red; }"],
  ["id selector", "#a { color: red; }", "#a[data-123456] { color: red; }"],
  ["universal selector", "* { color: red; }", "*[data-123456] { color: red; }"],
  [
    "bare attribute selector",
    "[disabled] { color: red; }",
    "[disabled][data-123456] { color: red; }",
  ],
  [
    "compound type/class/id/attribute",
    'input#id.cls[type="text"] { color: red; }',
    'input#id.cls[type="text"][data-123456] { color: red; }',
  ],
  [
    "attribute selector with namespace",
    "[*|href] { color: red; }",
    "[*|href][data-123456] { color: red; }",
  ],
  [
    "attribute selector with case flag",
    "[data-x=value i] { color: red; }",
    "[data-x=value i][data-123456] { color: red; }",
  ],
  [
    "namespaced type selector",
    "svg|circle { fill: red; }",
    "svg|circle[data-123456] { fill: red; }",
  ],
  [
    "escaped identifier",
    ".foo\\:bar { color: red; }",
    ".foo\\:bar[data-123456] { color: red; }",
  ],

  // ---------------------------------------------------------------------
  // Combinators and selector lists
  // ---------------------------------------------------------------------
  [
    "descendant combinator",
    ".a .b { color: red; }",
    ".a[data-123456] .b[data-123456] { color: red; }",
  ],
  [
    "child combinator",
    ".a > .b { color: red; }",
    ".a[data-123456] > .b[data-123456] { color: red; }",
  ],
  [
    "adjacent sibling combinator",
    ".a + .b { color: red; }",
    ".a[data-123456] + .b[data-123456] { color: red; }",
  ],
  [
    "general sibling combinator",
    ".a ~ .b { color: red; }",
    ".a[data-123456] ~ .b[data-123456] { color: red; }",
  ],
  [
    "selector list",
    ".a, .b { color: red; }",
    ".a[data-123456], .b[data-123456] { color: red; }",
  ],
  [
    "complex selector list",
    ".a > .b, #c + .d { color: red; }",
    ".a[data-123456] > .b[data-123456], #c[data-123456] + .d[data-123456] { color: red; }",
  ],
  [
    "three compound selector chain",
    ".a > .b + .c ~ .d { color: red; }",
    ".a[data-123456] > .b[data-123456] + .c[data-123456] ~ .d[data-123456] { color: red; }",
  ],
  [
    "leading combinator (invalid css, parsed)",
    "> .a { color: red; }",
    "> .a[data-123456] { color: red; }",
  ],

  // ---------------------------------------------------------------------
  // Pseudo-classes and pseudo-elements attached to a compound
  // ---------------------------------------------------------------------
  [
    "pseudo-class at end of compound",
    ".a:hover { color: red; }",
    ".a[data-123456]:hover { color: red; }",
  ],
  [
    "pseudo-element at end of compound",
    ".a::before { color: red; }",
    ".a[data-123456]::before { color: red; }",
  ],
  [
    "pseudo-class between compounds",
    ".a:hover .b { color: red; }",
    ".a[data-123456]:hover .b[data-123456] { color: red; }",
  ],
  [
    "pseudo-class before combinator",
    ".a:hover > .b { color: red; }",
    ".a[data-123456]:hover > .b[data-123456] { color: red; }",
  ],
  [
    "pseudo-class followed by class",
    ".a:hover.b { color: red; }",
    ".a[data-123456]:hover.b[data-123456] { color: red; }",
  ],
  [
    "chained pseudo-classes then pseudo-element",
    ".a:not(.b):not(.c)::before { color: red; }",
    ".a[data-123456]:not(.b):not(.c)::before { color: red; }",
  ],
  [
    ":nth-child(... of selector)",
    "li:nth-child(2n+1 of .a) { color: red; }",
    "li[data-123456]:nth-child(2n+1 of .a) { color: red; }",
  ],
  [
    ":not() with complex argument",
    ".a:not(.b > .c) { color: red; }",
    ".a[data-123456]:not(.b > .c) { color: red; }",
  ],
  [
    ":is()",
    ".a:is(.b, .c) { color: red; }",
    ".a[data-123456]:is(.b, .c) { color: red; }",
  ],
  [
    ":where()",
    ".a:where(.b .c) { color: red; }",
    ".a[data-123456]:where(.b .c) { color: red; }",
  ],
  [
    ":has()",
    ".a:has(> .b) { color: red; }",
    ".a[data-123456]:has(> .b) { color: red; }",
  ],
  [
    "functional pseudo-classes with legacy names",
    ".a:matches(.b, .c) { color: red; }",
    ".a[data-123456]:matches(.b, .c) { color: red; }",
  ],
  [
    "language and direction pseudo-classes",
    "p:lang(fr):dir(rtl) { color: red; }",
    "p[data-123456]:lang(fr):dir(rtl) { color: red; }",
  ],
  [
    "modern state pseudo-classes",
    ".a:open:popover-open { color: red; }",
    ".a[data-123456]:open:popover-open { color: red; }",
  ],
  [
    "::part()",
    ".host::part(button) { color: red; }",
    ".host[data-123456]::part(button) { color: red; }",
  ],
  [
    "::part() followed by pseudo-class",
    ".host::part(button):hover { color: red; }",
    ".host[data-123456]::part(button):hover { color: red; }",
  ],
  [
    "::slotted() on a compound",
    ".host::slotted(.a) { color: red; }",
    ".host[data-123456]::slotted(.a) { color: red; }",
  ],
  [
    "common pseudo-elements",
    ".a::marker, .a::selection, .a::placeholder { color: red; }",
    ".a[data-123456]::marker, .a[data-123456]::selection, .a[data-123456]::placeholder { color: red; }",
  ],
  [
    "view-transition pseudo-elements",
    ".a::view-transition-group(foo) { color: red; }",
    ".a[data-123456]::view-transition-group(foo) { color: red; }",
  ],
  [
    "customizable select pseudo-elements",
    ".a::picker(select) { color: red; }",
    ".a[data-123456]::picker(select) { color: red; }",
  ],
  [
    ":scope is preserved while the subject is scoped",
    ":scope > .a { color: red; }",
    ":scope > .a[data-123456] { color: red; }",
  ],

  // ---------------------------------------------------------------------
  // :deep / scope piercing (documented forms)
  // ---------------------------------------------------------------------
  [
    "::deep child",
    "p::deep > em { color: red; }",
    "p[data-123456] > em { color: red; }",
  ],
  [
    "::deep descendant",
    ".a::deep .b { color: red; }",
    ".a[data-123456] .b { color: red; }",
  ],
  [
    "::v-deep descendant",
    ".a::v-deep .b { color: red; }",
    ".a[data-123456] .b { color: red; }",
  ],
  [
    "::deep at end of compound",
    ".a::deep { color: red; }",
    ".a[data-123456] { color: red; }",
  ],
  [
    "leading ::v-deep",
    "::v-deep .a { color: red; }",
    "[data-123456] .a { color: red; }",
  ],
  [
    "::deep with class after it",
    "div.class1::deep.class2 { color: red; }",
    "div.class1[data-123456].class2 { color: red; }",
  ],

  // ---------------------------------------------------------------------
  // Conditional group at-rules
  // ---------------------------------------------------------------------
  [
    "@media",
    "@media only screen and (max-width: 962px) { .a { color: red; } }",
    "@media only screen and (max-width: 962px) { .a[data-123456] { color: red; } }",
  ],
  [
    "@media comma-separated conditions",
    "@media (min-width: 480px), tv and (max-width: 962px) { .a { color: red; } }",
    "@media (min-width: 480px), tv and (max-width: 962px) { .a[data-123456] { color: red; } }",
  ],
  [
    "@media range syntax",
    "@media (width >= 600px) { .a { color: red; } }",
    "@media (width >= 600px) { .a[data-123456] { color: red; } }",
  ],
  [
    "@media double range syntax",
    "@media (400px <= width <= 700px) { .a { color: red; } }",
    "@media (400px <= width <= 700px) { .a[data-123456] { color: red; } }",
  ],
  [
    "@media not",
    "@media not all and (monochrome) { .a { color: red; } }",
    "@media not all and (monochrome) { .a[data-123456] { color: red; } }",
  ],
  [
    "@supports",
    "@supports (display: grid) { .a { display: grid; } }",
    "@supports (display: grid) { .a[data-123456] { display: grid; } }",
  ],
  [
    "@supports not",
    "@supports not (display: grid) { .a { display: block; } }",
    "@supports not (display: grid) { .a[data-123456] { display: block; } }",
  ],
  [
    "@supports selector()",
    "@supports selector(:has(*)) { .a { color: red; } }",
    "@supports selector(:has(*)) { .a[data-123456] { color: red; } }",
  ],
  [
    "@container",
    "@container sidebar (min-width: 100px) and (max-width: 200px) { .a { color: red; } }",
    "@container sidebar (min-width: 100px) and (max-width: 200px) { .a[data-123456] { color: red; } }",
  ],
  [
    "@container style query",
    "@container style(--theme: dark) { .a { color: white; } }",
    "@container style(--theme: dark) { .a[data-123456] { color: white; } }",
  ],
  [
    "@container range syntax",
    "@container (width > 400px) { .a { color: red; } }",
    "@container (width > 400px) { .a[data-123456] { color: red; } }",
  ],
  [
    "@layer named",
    "@layer base { .a { color: red; } }",
    "@layer base { .a[data-123456] { color: red; } }",
  ],
  [
    "@layer anonymous",
    "@layer { .a { color: red; } }",
    "@layer { .a[data-123456] { color: red; } }",
  ],
  ["@layer statement", "@layer base, components;", "@layer base, components;"],
  [
    "@starting-style",
    "@starting-style { .a { opacity: 0; } }",
    "@starting-style { .a[data-123456] { opacity: 0; } }",
  ],
  [
    "@scope (rule body is scoped)",
    "@scope (.card) to (.content) { .a { color: red; } }",
    "@scope (.card) to (.content) { .a[data-123456] { color: red; } }",
  ],
  [
    "nested conditional group at-rules",
    "@media (min-width: 100px) { @supports (display: grid) { @container sidebar (min-width: 50px) { .a { display: grid; } } } }",
    "@media (min-width: 100px) { @supports (display: grid) { @container sidebar (min-width: 50px) { .a[data-123456] { display: grid; } } } }",
  ],
  [
    "unknown at-rule with rule children",
    "@foo bar { .a { color: red; } }",
    "@foo bar { .a[data-123456] { color: red; } }",
  ],

  // ---------------------------------------------------------------------
  // At-rules whose selectors/descriptors must not be scoped
  // ---------------------------------------------------------------------
  [
    "@keyframes selectors untouched",
    "@keyframes spin { from { opacity: 0; } 50% { opacity: 0.5; } to { opacity: 1; } }",
    "@keyframes spin { from { opacity: 0; } 50% { opacity: 0.5; } to { opacity: 1; } }",
  ],
  [
    "vendor-prefixed @keyframes untouched",
    "@-webkit-keyframes spin { from { opacity: 0; } to { opacity: 1; } }",
    "@-webkit-keyframes spin { from { opacity: 0; } to { opacity: 1; } }",
  ],
  [
    "@keyframes selector list untouched",
    "@keyframes fade { 0%, 50%, 100% { opacity: 0; } }",
    "@keyframes fade { 0%, 50%, 100% { opacity: 0; } }",
  ],
  [
    "@keyframes inside @layer untouched",
    "@layer a { @keyframes fade { from { opacity: 0; } } .a { animation: fade 1s; } }",
    "@layer a { @keyframes fade { from { opacity: 0; } } .a[data-123456] { animation: fade 1s; } }",
  ],
  [
    "@font-face untouched",
    '@font-face { font-family: "Test"; src: url("test.woff2") format("woff2"); }',
    '@font-face { font-family: "Test"; src: url("test.woff2") format("woff2"); }',
  ],
  [
    "@font-face inside @media untouched",
    '@media screen { @font-face { font-family: "Test"; src: url("test.woff2"); } }',
    '@media screen { @font-face { font-family: "Test"; src: url("test.woff2"); } }',
  ],
  [
    "@page and margin at-rules untouched",
    "@page :first { margin: 1cm; @top-left { content: 'x'; } }",
    "@page :first { margin: 1cm; @top-left { content: 'x'; } }",
  ],
  [
    "@property untouched",
    "@property --x { syntax: '<color>'; inherits: false; initial-value: red; }",
    "@property --x { syntax: '<color>'; inherits: false; initial-value: red; }",
  ],
  [
    "@counter-style untouched",
    "@counter-style thumbs { system: cyclic; symbols: 'x'; }",
    "@counter-style thumbs { system: cyclic; symbols: 'x'; }",
  ],
  [
    "@font-feature-values untouched",
    "@font-feature-values Font { @styleset { nice: 1; } }",
    "@font-feature-values Font { @styleset { nice: 1; } }",
  ],
  [
    "@import untouched",
    '@import url("theme.css"); .a { color: red; }',
    '@import url("theme.css"); .a[data-123456] { color: red; }',
  ],
  [
    "@import with layer/supports untouched",
    '@import url("theme.css") layer(base) supports(display: grid) screen; .a { color: red; }',
    '@import url("theme.css") layer(base) supports(display: grid) screen; .a[data-123456] { color: red; }',
  ],
  [
    "@charset and @namespace untouched",
    '@charset "UTF-8"; @namespace svg url(http://www.w3.org/2000/svg); svg|a { color: red; }',
    '@charset "UTF-8"; @namespace svg url(http://www.w3.org/2000/svg); svg|a[data-123456] { color: red; }',
  ],
  [
    "modern at-rules without style rules untouched",
    "@view-transition { navigation: auto; } @position-try --foo { top: 0; }",
    "@view-transition { navigation: auto; } @position-try --foo { top: 0; }",
  ],

  // ---------------------------------------------------------------------
  // Declarations, values and parser robustness
  // ---------------------------------------------------------------------
  [
    "custom property with empty value",
    ".a { --x: ; }",
    ".a[data-123456] { --x: ; }",
  ],
  [
    "custom property containing a block",
    ".a { --x: { color: red; }; }",
    ".a[data-123456] { --x: { color: red; }; }",
  ],
  [
    "custom property with !important",
    ".a { --x: red !important; }",
    ".a[data-123456] { --x: red !important; }",
  ],
  [
    "data uri value",
    '.a { background: url("data:image/svg+xml;utf8,<svg></svg>"); }',
    '.a[data-123456] { background: url("data:image/svg+xml;utf8,<svg></svg>"); }',
  ],
  [
    "grid-template-areas strings",
    '.a { grid-template-areas: "a b" "c d"; }',
    '.a[data-123456] { grid-template-areas: "a b" "c d"; }',
  ],
  [
    "content string with punctuation",
    '.a { content: "</div>;{}"; }',
    '.a[data-123456] { content: "</div>;{}"; }',
  ],
  [
    "modern color syntaxes",
    ".a { color: oklch(0.7 0.1 200 / 50%); background: light-dark(red, blue); border-color: color(display-p3 1 0 0); }",
    ".a[data-123456] { color: oklch(0.7 0.1 200 / 50%); background: light-dark(red, blue); border-color: color(display-p3 1 0 0); }",
  ],
  [
    "anchor positioning and if() values",
    ".a { top: anchor(--a bottom); color: if(style(--x: 1): red; else: blue); }",
    ".a[data-123456] { top: anchor(--a bottom); color: if(style(--x: 1): red; else: blue); }",
  ],
  [
    "nested math functions",
    ".a { width: calc(100% - min(2rem, 5vw)); }",
    ".a[data-123456] { width: calc(100% - min(2rem, 5vw)); }",
  ],
  [
    "unicode-range descriptor",
    '@font-face { font-family: "X"; unicode-range: U+0025-00FF; }',
    '@font-face { font-family: "X"; unicode-range: U+0025-00FF; }',
  ],
  [
    "legacy IE hacks survive",
    ".a { *zoom: 1; _color: red; color: red\\9; }",
    ".a[data-123456] { *zoom: 1; _color: red; color: red\\9; }",
  ],
  [
    "unknown pseudo-class preserved",
    ".a:unknown-pseudo { color: red; }",
    ".a[data-123456]:unknown-pseudo { color: red; }",
  ],
  ["empty stylesheet", "", ""],
  [
    "tolerant of an unclosed block",
    ".a { color: red;",
    ".a[data-123456] { color: red; }",
  ],
  [
    "multiple top-level rules",
    ".a { color: red; } .b { color: blue; }",
    ".a[data-123456] { color: red; } .b[data-123456] { color: blue; }",
  ],
  // ---------------------------------------------------------------------
  // Selectors made only of pseudo selectors
  // ---------------------------------------------------------------------
  [
    "standalone pseudo-class",
    ":hover { color: red; }",
    ":hover[data-123456] { color: red; }",
  ],
  [
    "standalone functional :is()",
    ":is(.a, .b) { color: red; }",
    ":is(.a, .b)[data-123456] { color: red; }",
  ],
  [
    "standalone functional :where()",
    ":where(.a, .b) { color: red; }",
    ":where(.a, .b)[data-123456] { color: red; }",
  ],
  [
    "standalone functional :not()",
    ":not(.a) { color: red; }",
    ":not(.a)[data-123456] { color: red; }",
  ],
  [
    "standalone functional :has()",
    ":has(.a) { color: red; }",
    ":has(.a)[data-123456] { color: red; }",
  ],
  [
    "standalone pseudo-element",
    "::before { color: red; }",
    "[data-123456]::before { color: red; }",
  ],
  [
    "standalone ::slotted()",
    "::slotted(.a) { color: red; }",
    "[data-123456]::slotted(.a) { color: red; }",
  ],
  [
    "scope attribute with a leading pseudo-element",
    "*::before { color: red; }",
    "*[data-123456]::before { color: red; }",
  ],
  [
    "pseudo-class then pseudo-element",
    ".a:not(.b)::before { color: red; }",
    ".a[data-123456]:not(.b)::before { color: red; }",
  ],
  [
    "document root pseudo-classes stay global",
    ":root { --x: red; } :root:has(.a) { color: red; }",
    ":root { --x: red; } :root:has(.a) { color: red; }",
  ],
  [
    "document root still scopes descendant subjects",
    ":root .b { color: red; }",
    ":root .b[data-123456] { color: red; }",
  ],

  // ---------------------------------------------------------------------
  // Leading pseudo-only compound in a complex selector
  // ---------------------------------------------------------------------
  [
    "leading :hover compound",
    ":hover > .b { color: red; }",
    ":hover[data-123456] > .b[data-123456] { color: red; }",
  ],
  [
    "leading :is() compound",
    ":is(.a) .b { color: red; }",
    ":is(.a)[data-123456] .b[data-123456] { color: red; }",
  ],
  [
    "leading :not() compound",
    ":not(.a) ~ .b { color: red; }",
    ":not(.a)[data-123456] ~ .b[data-123456] { color: red; }",
  ],
  [
    "leading :where() compound",
    ":where(.a) .b { color: red; }",
    ":where(.a)[data-123456] .b[data-123456] { color: red; }",
  ],

  // ---------------------------------------------------------------------
  // CSS nesting
  // ---------------------------------------------------------------------
  [
    "nesting with & descendant",
    ".a { & .b { color: red; } }",
    ".a[data-123456] { & .b[data-123456] { color: red; } }",
  ],
  [
    "nesting with & sibling",
    ".a { & + .b { color: red; } }",
    ".a[data-123456] { & + .b[data-123456] { color: red; } }",
  ],
  [
    "nesting with & and additional class",
    ".a { &.foo { color: red; } }",
    ".a[data-123456] { &.foo[data-123456] { color: red; } }",
  ],
  [
    "nesting with & and pseudo-class",
    ".a { &:hover { color: red; } }",
    ".a[data-123456] { &:hover { color: red; } }",
  ],
  [
    "nesting with parent selector at the end",
    ".a { .b & { color: red; } }",
    ".a[data-123456]{.b[data-123456] &{color:red}}",
  ],
  [
    "implicit descendant nesting",
    ".a { .b { color: red; } }",
    ".a[data-123456]{.b[data-123456]{color:red}}",
  ],
  [
    "implicit child nesting",
    ".a { > .b { color: red; } }",
    ".a[data-123456]{>.b[data-123456]{color:red}}",
  ],
  [
    "recursively nested rules",
    ".a { .b { .c { color: red; } } }",
    ".a[data-123456]{.b[data-123456]{.c[data-123456]{color:red}}}",
  ],
  [
    "recursively nested & rules",
    ".a { & .b { & .c { color: red; } } }",
    ".a[data-123456]{& .b[data-123456]{& .c[data-123456]{color:red}}}",
  ],
  [
    "nesting with & inside @media",
    ".a { @media (min-width: 1px) { & + .b { color: red; } } }",
    ".a[data-123456] { @media (min-width: 1px) { & + .b[data-123456] { color: red; } } }",
  ],
  [
    "implicit nesting inside @media",
    ".a { @media (min-width: 1px) { .b { color: red; } } }",
    ".a[data-123456]{@media (min-width:1px){.b[data-123456]{color:red}}}",
  ],

  // ---------------------------------------------------------------------
  // Column combinator (serialized as Raw by css-tree)
  // ---------------------------------------------------------------------
  [
    "column combinator ||",
    ".a || .b { color: red; }",
    ".a[data-123456] || .b[data-123456] { color: red; }",
  ],
  [
    "multiple column combinators",
    ".a || .b || .c { color: red; }",
    ".a[data-123456] || .b[data-123456] || .c[data-123456] { color: red; }",
  ],
  [
    "column combinator mixed with other combinators",
    ".a > .b || .c + .d { color: red; }",
    ".a[data-123456]>.b[data-123456] || .c[data-123456]+.d[data-123456]{color:red}",
  ],
  [
    "column combinator with pseudo selectors",
    ".a:hover || .b::before { color: red; }",
    ".a[data-123456]:hover || .b[data-123456]::before { color: red; }",
  ],

  // ---------------------------------------------------------------------
  // :deep() function form
  // ---------------------------------------------------------------------
  [
    ":deep() function form",
    ".a :deep(.b) { color: red; }",
    ".a[data-123456] .b { color: red; }",
  ],
  [
    ":deep() with a complex argument",
    ".a :deep(.b > .c) { color: red; }",
    ".a[data-123456] .b > .c { color: red; }",
  ],
  [
    ":deep() with a selector list argument",
    ".a :deep(.b, .c) { color: red; }",
    ".a[data-123456] :is(.b, .c) { color: red; }",
  ],
  [
    "standalone :deep()",
    ":deep(.a, .b) { color: red; }",
    ":is(.a, .b) { color: red; }",
  ],
];

describe("css feature support", () => {
  supported.forEach(([name, input, expected]) => {
    it(name, () => validateCss(input, expected));
  });
});
