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

  // =====================================================================
  // Cutting-edge CSS
  // =====================================================================

  // ---------------------------------------------------------------------
  // New and experimental pseudo-classes
  // ---------------------------------------------------------------------
  [
    ":state() custom state",
    ".a:state(open) { color: red; }",
    ".a[data-123456]:state(open) { color: red; }",
  ],
  [
    "standalone :state()",
    ":state(open) { color: red; }",
    ":state(open)[data-123456] { color: red; }",
  ],
  [
    ":active-view-transition",
    ".a:active-view-transition { color: red; }",
    ".a[data-123456]:active-view-transition { color: red; }",
  ],
  [
    ":active-view-transition-type()",
    ".a:active-view-transition-type(slide) { color: red; }",
    ".a[data-123456]:active-view-transition-type(slide) { color: red; }",
  ],
  [
    ":modal, :fullscreen, :picture-in-picture",
    "dialog:modal, .a:fullscreen, .a:picture-in-picture { color: red; }",
    "dialog[data-123456]:modal, .a[data-123456]:fullscreen, .a[data-123456]:picture-in-picture { color: red; }",
  ],
  [
    ":open and :closed",
    ".a:open, .a:closed { color: red; }",
    ".a[data-123456]:open, .a[data-123456]:closed { color: red; }",
  ],
  [
    "media element pseudo-classes",
    ".a:playing, .a:paused, .a:seeking, .a:buffering, .a:stalled, .a:muted, .a:volume-locked { color: red; }",
    ".a[data-123456]:playing, .a[data-123456]:paused, .a[data-123456]:seeking, .a[data-123456]:buffering, .a[data-123456]:stalled, .a[data-123456]:muted, .a[data-123456]:volume-locked { color: red; }",
  ],
  [
    "form state pseudo-classes",
    ".a:user-valid, .a:user-invalid, .a:autofill, .a:blank { color: red; }",
    ".a[data-123456]:user-valid, .a[data-123456]:user-invalid, .a[data-123456]:autofill, .a[data-123456]:blank { color: red; }",
  ],
  [
    ":defined",
    ".a:defined { color: red; }",
    ".a[data-123456]:defined { color: red; }",
  ],
  [
    ":host and friends",
    ":host, :host(.a), :host-context(.b) { color: red; }",
    ":host[data-123456], :host(.a)[data-123456], :host-context(.b)[data-123456] { color: red; }",
  ],
  [
    "slot and interest pseudo-classes",
    ".a:has-slotted, .a:interest-source, .a:interest-target { color: red; }",
    ".a[data-123456]:has-slotted, .a[data-123456]:interest-source, .a[data-123456]:interest-target { color: red; }",
  ],
  [
    "scroll marker target pseudo-classes",
    ".a:target-current, .a:target-before, .a:target-after { color: red; }",
    ".a[data-123456]:target-current, .a[data-123456]:target-before, .a[data-123456]:target-after { color: red; }",
  ],
  [
    ":heading and :heading()",
    ".a:heading, .a:heading(1) { color: red; }",
    ".a[data-123456]:heading, .a[data-123456]:heading(1) { color: red; }",
  ],
  [
    "table column pseudo-classes",
    "td:nth-col(2), td:nth-last-col(2) { color: red; }",
    "td[data-123456]:nth-col(2), td[data-123456]:nth-last-col(2) { color: red; }",
  ],
  [
    "link pseudo-classes",
    ".a:any-link, .a:local-link(0) { color: red; }",
    ".a[data-123456]:any-link, .a[data-123456]:local-link(0) { color: red; }",
  ],
  [
    "nested modern functional pseudo-classes",
    ".a:is(:has(> .b), :state(open)) { color: red; }",
    ".a[data-123456]:is(:has(> .b), :state(open)) { color: red; }",
  ],
  [
    ":nth-child(of :not())",
    "li:nth-child(2n of :not(.a, .b)) { color: red; }",
    "li[data-123456]:nth-child(2n of :not(.a, .b)) { color: red; }",
  ],
  [
    ":nth-last-child(of :is())",
    "li:nth-last-child(2n of :is(.a, .b)) { color: red; }",
    "li[data-123456]:nth-last-child(2n of :is(.a, .b)) { color: red; }",
  ],

  // ---------------------------------------------------------------------
  // New and experimental pseudo-elements
  // ---------------------------------------------------------------------
  [
    "::details-content",
    ".a::details-content { color: red; }",
    ".a[data-123456]::details-content { color: red; }",
  ],
  [
    "::backdrop",
    ".a::backdrop { color: red; }",
    ".a[data-123456]::backdrop { color: red; }",
  ],
  [
    "standalone ::backdrop",
    "::backdrop { color: red; }",
    "[data-123456]::backdrop { color: red; }",
  ],
  [
    "::file-selector-button",
    "input::file-selector-button { color: red; }",
    "input[data-123456]::file-selector-button { color: red; }",
  ],
  [
    "::first-letter and ::first-line",
    ".a::first-letter, .a::first-line { color: red; }",
    ".a[data-123456]::first-letter, .a[data-123456]::first-line { color: red; }",
  ],
  [
    "::highlight()",
    ".a::highlight(foo) { color: red; }",
    ".a[data-123456]::highlight(foo) { color: red; }",
  ],
  [
    "standalone ::highlight()",
    "::highlight(foo) { color: red; }",
    "[data-123456]::highlight(foo) { color: red; }",
  ],
  [
    "::search-text and ::target-text",
    ".a::search-text, .a::target-text { color: red; }",
    ".a[data-123456]::search-text, .a[data-123456]::target-text { color: red; }",
  ],
  [
    "::spelling-error and ::grammar-error",
    ".a::spelling-error, .a::grammar-error { color: red; }",
    ".a[data-123456]::spelling-error, .a[data-123456]::grammar-error { color: red; }",
  ],
  [
    "scroll marker pseudo-elements",
    ".a::scroll-marker, .a::scroll-marker-group, .a::scroll-button(left) { color: red; }",
    ".a[data-123456]::scroll-marker, .a[data-123456]::scroll-marker-group, .a[data-123456]::scroll-button(left) { color: red; }",
  ],
  [
    "::column",
    ".a::column { color: red; }",
    ".a[data-123456]::column { color: red; }",
  ],
  [
    "customizable select pseudo-elements",
    ".a::checkmark, .a::picker-icon { color: red; }",
    ".a[data-123456]::checkmark, .a[data-123456]::picker-icon { color: red; }",
  ],
  [
    "::cue and ::cue-region()",
    "video::cue, video::cue-region(.a) { color: red; }",
    "video[data-123456]::cue, video[data-123456]::cue-region(.a) { color: red; }",
  ],
  [
    "standalone ::cue",
    "::cue { color: red; }",
    "[data-123456]::cue { color: red; }",
  ],
  [
    "bare view-transition pseudo-elements stay global",
    "::view-transition-old(root) { opacity: 0; }",
    "::view-transition-old(root) { opacity: 0; }",
  ],
  [
    "bare view-transition pseudo-element list stays global",
    "::view-transition-old(root), ::view-transition-new(root), ::view-transition-group(*), ::view-transition-image-pair(*) { opacity: 0; }",
    "::view-transition-old(root), ::view-transition-new(root), ::view-transition-group(*), ::view-transition-image-pair(*) { opacity: 0; }",
  ],
  [
    "view-transition pseudo-element on :root stays global",
    ":root::view-transition-group(foo) { opacity: 0; }",
    ":root::view-transition-group(foo) { opacity: 0; }",
  ],

  // ---------------------------------------------------------------------
  // New and experimental at-rules
  // ---------------------------------------------------------------------
  [
    "@scope prelude is not scoped, body is",
    "@scope (.card) to (.content) { .a { color: red; } }",
    "@scope (.card) to (.content) { .a[data-123456] { color: red; } }",
  ],
  [
    "@scope keeps :scope global",
    "@scope (.card) { :scope { color: red; } .a { color: blue; } }",
    "@scope (.card) { :scope { color: red; } .a[data-123456] { color: blue; } }",
  ],
  [
    "@scope nested in @media",
    "@media (width > 1px) { @scope (.card) { .a { color: red; } } }",
    "@media (width > 1px) { @scope (.card) { .a[data-123456] { color: red; } } }",
  ],
  [
    "@scope nested in @layer",
    "@layer x { @scope (.card) { .a { color: red; } } }",
    "@layer x { @scope (.card) { .a[data-123456] { color: red; } } }",
  ],
  [
    "@starting-style with nested conditional rule",
    "@starting-style { @media (prefers-reduced-motion: no-preference) { .a { opacity: 0; } } }",
    "@starting-style { @media (prefers-reduced-motion: no-preference) { .a[data-123456] { opacity: 0; } } }",
  ],
  [
    "@container name-only query",
    "@container card { .a { color: red; } }",
    "@container card { .a[data-123456] { color: red; } }",
  ],
  [
    "@container scroll-state()",
    "@container scroll-state(stuck: top) { .a { color: red; } }",
    "@container scroll-state(stuck: top) { .a[data-123456] { color: red; } }",
  ],
  [
    "@container named scroll-state()",
    "@container card scroll-state(scrollable: bottom) { .a { color: red; } }",
    "@container card scroll-state(scrollable: bottom) { .a[data-123456] { color: red; } }",
  ],
  [
    "@container style() and size",
    "@container style(--theme: dark) and (width > 100px) { .a { color: red; } }",
    "@container style(--theme: dark) and (width > 100px) { .a[data-123456] { color: red; } }",
  ],
  [
    "@supports at-rule()",
    "@supports at-rule(@starting-style) { .a { color: red; } }",
    "@supports at-rule(@starting-style) { .a[data-123456] { color: red; } }",
  ],
  [
    "@supports font-tech()",
    "@supports font-tech(color-COLRv1) { .a { color: red; } }",
    "@supports font-tech(color-COLRv1) { .a[data-123456] { color: red; } }",
  ],
  [
    "@supports font-format()",
    "@supports font-format(woff2) { .a { color: red; } }",
    "@supports font-format(woff2) { .a[data-123456] { color: red; } }",
  ],
  [
    "@media scripting",
    "@media (scripting: none) { .a { color: red; } }",
    "@media (scripting: none) { .a[data-123456] { color: red; } }",
  ],
  [
    "@media modern interaction features",
    "@media (hover: hover) and (pointer: fine) and (update: fast) and (prefers-reduced-motion: reduce) { .a { color: red; } }",
    "@media (hover: hover) and (pointer: fine) and (update: fast) and (prefers-reduced-motion: reduce) { .a[data-123456] { color: red; } }",
  ],
  [
    "@media forced-colors and inverted-colors",
    "@media (forced-colors: active) and (inverted-colors: inverted) { .a { color: red; } }",
    "@media (forced-colors: active) and (inverted-colors: inverted) { .a[data-123456] { color: red; } }",
  ],
  [
    "@media reduced transparency and data",
    "@media (prefers-reduced-transparency: reduce) and (prefers-reduced-data: reduce) { .a { color: red; } }",
    "@media (prefers-reduced-transparency: reduce) and (prefers-reduced-data: reduce) { .a[data-123456] { color: red; } }",
  ],
  [
    "@property inside @layer untouched",
    "@layer x { @property --x { syntax: '<color>'; inherits: false; initial-value: red; } }",
    "@layer x { @property --x { syntax: '<color>'; inherits: false; initial-value: red; } }",
  ],
  [
    "@function untouched",
    "@function --double(--x <number>) returns <number> { result: calc(var(--x) * 2); }",
    "@function --double(--x <number>) returns <number> { result: calc(var(--x) * 2); }",
  ],
  [
    "@function inside @layer untouched",
    "@layer x { @function --f() returns <number> { result: 1; } }",
    "@layer x { @function --f() returns <number> { result: 1; } }",
  ],
  [
    "@mixin untouched",
    "@mixin --card(--x: 1) { color: red; }",
    "@mixin --card(--x: 1) { color: red; }",
  ],
  [
    "@apply inside a rule untouched",
    ".a { @apply --card; }",
    ".a[data-123456] { @apply --card; }",
  ],
  [
    "@custom-media untouched",
    "@custom-media --narrow (width < 30em); .a { color: red; }",
    "@custom-media --narrow (width < 30em); .a[data-123456] { color: red; }",
  ],
  [
    "@custom-selector untouched",
    "@custom-selector :--heading h1, h2; .a { color: red; }",
    "@custom-selector :--heading h1, h2; .a[data-123456] { color: red; }",
  ],
  [
    "@color-profile untouched",
    "@color-profile --prof { src: url(prof.icc); rendering-intent: relative-colorimetric; }",
    "@color-profile --prof { src: url(prof.icc); rendering-intent: relative-colorimetric; }",
  ],
  [
    "@font-palette-values untouched",
    "@font-palette-values --pal { font-family: X; base-palette: 1; }",
    "@font-palette-values --pal { font-family: X; base-palette: 1; }",
  ],
  [
    "@position-try inside @layer untouched",
    "@layer x { @position-try --t { top: 0; } }",
    "@layer x { @position-try --t { top: 0; } }",
  ],
  [
    "@view-transition inside @media untouched",
    "@media screen { @view-transition { navigation: auto; types: a b; } }",
    "@media screen { @view-transition { navigation: auto; types: a b; } }",
  ],
  [
    "@when and @else",
    "@when media(width > 1px) { .a { color: red; } } @else { .a { color: blue; } }",
    "@when media(width > 1px) { .a[data-123456] { color: red; } } @else { .a[data-123456] { color: blue; } }",
  ],
  [
    "@keyframes timeline range selectors untouched",
    "@keyframes reveal { entry 0% { opacity: 0; } exit 100% { opacity: 1; } }",
    "@keyframes reveal { entry 0% { opacity: 0; } exit 100% { opacity: 1; } }",
  ],
  [
    "@keyframes contain range selectors untouched",
    "@keyframes reveal { contain 0% { opacity: 0; } contain 100% { opacity: 1; } }",
    "@keyframes reveal { contain 0% { opacity: 0; } contain 100% { opacity: 1; } }",
  ],
  [
    "@keyframes mixed range selectors untouched",
    "@keyframes reveal { from { opacity: 0; } entry 50% { opacity: 0.5; } to { opacity: 1; } }",
    "@keyframes reveal { from { opacity: 0; } entry 50% { opacity: 0.5; } to { opacity: 1; } }",
  ],
  [
    "@font-face tech() untouched",
    '@font-face { font-family: X; src: url(x.woff2) format("woff2") tech(color-COLRv1); }',
    '@font-face { font-family: X; src: url(x.woff2) format("woff2") tech(color-COLRv1); }',
  ],
  [
    "@page margin boxes inside @media untouched",
    "@media print { @page { margin: 1cm; @top-left { content: 'x'; } } }",
    "@media print { @page { margin: 1cm; @top-left { content: 'x'; } } }",
  ],
  [
    "@counter-style inside @layer untouched",
    "@layer x { @counter-style c { system: cyclic; symbols: 'x'; } }",
    "@layer x { @counter-style c { system: cyclic; symbols: 'x'; } }",
  ],
  [
    "@import with selector() supports untouched",
    '@import url("theme.css") supports(selector(:has(*))); .a { color: red; }',
    '@import url("theme.css") supports(selector(:has(*))); .a[data-123456] { color: red; }',
  ],

  // ---------------------------------------------------------------------
  // Modern values and functions (declarations stay untouched)
  // ---------------------------------------------------------------------
  [
    "contrast-color(), color-mix() and relative colors",
    ".a { color: contrast-color(red); background: color-mix(in oklab, red 40%, blue); border-color: rgb(from red r g b / 50%); outline-color: alpha(red / 50%); }",
    ".a[data-123456] { color: contrast-color(red); background: color-mix(in oklab, red 40%, blue); border-color: rgb(from red r g b / 50%); outline-color: alpha(red / 50%); }",
  ],
  [
    "light-dark() for images",
    ".a { background-image: light-dark(url(a.png), url(b.png)); }",
    ".a[data-123456] { background-image: light-dark(url(a.png), url(b.png)); }",
  ],
  [
    "if() conditional values",
    ".a { color: if(media(width > 100px): red; else: blue); }",
    ".a[data-123456] { color: if(media(width > 100px): red; else: blue); }",
  ],
  [
    "typed attr()",
    ".a { width: attr(data-w type(<length>), 1px); order: attr(data-o type(<number>), 0); }",
    ".a[data-123456] { width: attr(data-w type(<length>), 1px); order: attr(data-o type(<number>), 0); }",
  ],
  [
    "sibling-index(), sibling-count() and progress()",
    ".a { order: sibling-index(); z-index: sibling-count(); width: progress(1 / 2); }",
    ".a[data-123456] { order: sibling-index(); z-index: sibling-count(); width: progress(1 / 2); }",
  ],
  [
    "random() and random-item()",
    ".a { width: random(1px, 10px); content: random-item(--x, red, blue); }",
    ".a[data-123456] { width: random(1px, 10px); content: random-item(--x, red, blue); }",
  ],
  [
    "calc-size() and interpolate-size",
    ".a { width: calc-size(auto, size + 1rem); interpolate-size: allow-keywords; }",
    ".a[data-123456] { width: calc-size(auto, size + 1rem); interpolate-size: allow-keywords; }",
  ],
  [
    "shape() in clip-path",
    ".a { clip-path: shape(from 0 0, line to 100% 0, curve to 0 100% with 50% 50%); }",
    ".a[data-123456] { clip-path: shape(from 0 0, line to 100% 0, curve to 0 100% with 50% 50%); }",
  ],
  [
    "scroll-driven animation properties",
    ".a { animation-timeline: scroll(nearest block); scroll-timeline: --x block; view-timeline: --y block; timeline-scope: --z; }",
    ".a[data-123456] { animation-timeline: scroll(nearest block); scroll-timeline: --x block; view-timeline: --y block; timeline-scope: --z; }",
  ],
  [
    "anchor positioning properties",
    ".a { position-anchor: --x; top: anchor(--x bottom); width: anchor-size(--x width); position-area: bottom span-right; position-try-fallbacks: --foo; anchor-scope: --x; }",
    ".a[data-123456] { position-anchor: --x; top: anchor(--x bottom); width: anchor-size(--x width); position-area: bottom span-right; position-try-fallbacks: --foo; anchor-scope: --x; }",
  ],
  [
    "field-sizing and zoom",
    "textarea { field-sizing: content; zoom: 2; }",
    "textarea[data-123456] { field-sizing: content; zoom: 2; }",
  ],
  [
    "container query units",
    ".a { width: 100cqi; height: 50cqb; padding: calc(1cqw + 1cqh); }",
    ".a[data-123456] { width: 100cqi; height: 50cqb; padding: calc(1cqw + 1cqh); }",
  ],
  [
    "view transition properties",
    ".a { view-transition-name: card; view-transition-class: fade; }",
    ".a[data-123456] { view-transition-name: card; view-transition-class: fade; }",
  ],
  [
    "modern math functions",
    ".a { width: round(1.5rem, 1px); height: mod(10px, 3px); margin: rem(10px, 3px); opacity: abs(-0.5); z-index: sign(10px); font-size: pow(2, 3); line-height: sqrt(16); inset: hypot(3px, 4px); }",
    ".a[data-123456] { width: round(1.5rem, 1px); height: mod(10px, 3px); margin: rem(10px, 3px); opacity: abs(-0.5); z-index: sign(10px); font-size: pow(2, 3); line-height: sqrt(16); inset: hypot(3px, 4px); }",
  ],
  [
    "linear() easing",
    ".a { transition-timing-function: linear(0, 0.25 25%, 1); }",
    ".a[data-123456] { transition-timing-function: linear(0, 0.25 25%, 1); }",
  ],
  [
    "dynamic viewport and root font units",
    ".a { height: 100dvh; min-height: 100svh; max-height: 100lvh; width: 100dvw; font-size: 2rcap; line-height: 1rch; }",
    ".a[data-123456] { height: 100dvh; min-height: 100svh; max-height: 100lvh; width: 100dvw; font-size: 2rcap; line-height: 1rch; }",
  ],
  [
    "text and shape properties",
    ".a { text-wrap: balance; text-box-trim: trim-both; text-box-edge: cap alphabetic; corner-shape: squircle; }",
    ".a[data-123456] { text-wrap: balance; text-box-trim: trim-both; text-box-edge: cap alphabetic; corner-shape: squircle; }",
  ],
  [
    "reading flow and discrete transitions",
    ".a { reading-flow: flex-visual; reading-order: 1; transition-behavior: allow-discrete; overlay: auto; }",
    ".a[data-123456] { reading-flow: flex-visual; reading-order: 1; transition-behavior: allow-discrete; overlay: auto; }",
  ],
  [
    "revert-rule and newly baseline values",
    ".a { color: revert-rule; text-decoration-skip-ink: all; image-rendering: crisp-edges; overflow-anchor: none; }",
    ".a[data-123456] { color: revert-rule; text-decoration-skip-ink: all; image-rendering: crisp-edges; overflow-anchor: none; }",
  ],

  // ---------------------------------------------------------------------
  // Nesting with modern selectors and at-rules
  // ---------------------------------------------------------------------
  [
    "implicit nesting with :is()",
    ".a { :is(.b, .c) { color: red; } }",
    ".a[data-123456]{:is(.b,.c)[data-123456]{color:red}}",
  ],
  [
    "implicit nesting with :where()",
    ".a { > :where(.b, .c) { color: red; } }",
    ".a[data-123456]{>:where(.b,.c)[data-123456]{color:red}}",
  ],
  [
    "implicit nesting with :has()",
    ".a { :has(.b) { color: red; } }",
    ".a[data-123456]{:has(.b)[data-123456]{color:red}}",
  ],
  [
    "implicit nesting with :not()",
    ".a { :not(.b) { color: red; } }",
    ".a[data-123456]{:not(.b)[data-123456]{color:red}}",
  ],
  [
    "implicit nesting with a standalone pseudo-class",
    ".a { :hover { color: red; } }",
    ".a[data-123456]{:hover[data-123456]{color:red}}",
  ],
  [
    "nesting selector inside :is()",
    ".a { :is(&, .b) { color: red; } }",
    ".a[data-123456]{:is(&,.b)[data-123456]{color:red}}",
  ],
  [
    "nesting selector prefixed to :is()",
    ".a { &:is(.b, .c) { color: red; } }",
    ".a[data-123456]{&:is(.b, .c){color:red}}",
  ],
  [
    "nested & with modern :has()",
    ".a { &:has(> .b) { color: red; } }",
    ".a[data-123456]{&:has(> .b){color:red}}",
  ],
  [
    "nested & with ::part()",
    ".a { &::part(button) { color: red; } }",
    ".a[data-123456]{&::part(button){color:red}}",
  ],
  [
    "nested & with ::details-content",
    ".a { &::details-content { color: red; } }",
    ".a[data-123456]{&::details-content{color:red}}",
  ],
  [
    "nested & with view-transition pseudo-element",
    ".a { &::view-transition-group(foo) { color: red; } }",
    ".a[data-123456]{&::view-transition-group(foo){color:red}}",
  ],
  [
    "nested :deep() function",
    ".a { :deep(.b) { color: red; } }",
    ".a[data-123456]{.b{color:red}}",
  ],
  [
    "nested :deep() function with pseudo-element",
    ".a { :deep(.b)::before { color: red; } }",
    ".a[data-123456]{.b::before{color:red}}",
  ],
  [
    "nested modern at-rule with rule list",
    ".a { @media (width > 1px) { .b, .c { color: red; } } }",
    ".a[data-123456]{@media (width>1px){.b[data-123456],.c[data-123456]{color:red}}}",
  ],
  [
    "nested @container with modern query",
    ".a { @container card scroll-state(stuck: top) { .b { color: red; } } }",
    ".a[data-123456]{@container card scroll-state(stuck: top){.b[data-123456]{color:red}}}",
  ],
  [
    "nested @supports at-rule()",
    ".a { @supports at-rule(@starting-style) { .b { color: red; } } }",
    ".a[data-123456]{@supports at-rule(@starting-style){.b[data-123456]{color:red}}}",
  ],
  [
    "nested @layer with a rule",
    ".a { @layer x { .b { color: red; } } }",
    ".a[data-123456]{@layer x{.b[data-123456]{color:red}}}",
  ],
  [
    "nested @starting-style with a rule",
    ".a { @starting-style { .b { opacity: 0; } } }",
    ".a[data-123456]{@starting-style{.b[data-123456]{opacity:0}}}",
  ],
  [
    "nested @starting-style declarations untouched",
    ".a { @starting-style { opacity: 0; } }",
    ".a[data-123456]{@starting-style{opacity:0}}",
  ],
  [
    "declarations after nested rules",
    ".a { color: red; & .b { color: blue; } background: green; }",
    ".a[data-123456]{color:red;& .b[data-123456]{color:blue}background:green}",
  ],
  [
    "nested rule with modern pseudo-classes",
    ".a { .b:has(> .c):state(open) { color: red; } }",
    ".a[data-123456]{.b[data-123456]:has(>.c):state(open){color:red}}",
  ],
];

describe("css feature support", () => {
  supported.forEach(([name, input, expected]) => {
    it(name, () => validateCss(input, expected));
  });
});
