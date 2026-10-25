import { parse, generate } from "css-tree";
import { scopeCss } from "./scope-css";

const validateCss = (inputCss, expectedScopedCss) => {
  const result = scopeCss(inputCss, "test.scoped.css", "data-123456");
  const expectedResult = generate(parse(expectedScopedCss));

  expect(result.code).toBe(expectedResult);
};

describe("scope-css", () => {
  it("generates a sourcemap for the transformed css", () => {
    const result = scopeCss(
      ".content-container { width: 962px; }",
      "test.scoped.css",
      "data-123456",
    );

    expect(result.map).not.toBeNull();

    const map = JSON.parse(result.map as string);
    expect(map.version).toBe(3);
    expect(map.sources).toEqual(["test.scoped.css"]);
    expect(map.mappings).not.toHaveLength(0);
  });

  describe("Basic css", () => {
    it("scopes basic classes and elements", () => {
      validateCss(
        ".content-container { width: 962px; } div { background: green; }",
        ".content-container[data-123456] { width: 962px; } div[data-123456] { background: green; }",
      );
    });

    it("scopes adjecent sibiling selectors correctly", () => {
      validateCss(
        "h4 + p { color: green; }",
        "h4[data-123456] + p[data-123456] { color: green; }",
      );
    });

    it("scopes child selectors correctly", () => {
      validateCss(
        "p > em { color: green; }",
        "p[data-123456] > em[data-123456] { color: green; }",
      );
    });

    it("scopes susequent selectors correctly", () => {
      validateCss(
        "p ~ em { color: green; }",
        "p[data-123456] ~ em[data-123456] { color: green; }",
      );
    });

    it("scopes id selectors correctly", () => {
      validateCss(
        "#content { border: 2px solid green; }",
        "#content[data-123456] { border: 2px solid green; }",
      );
      validateCss(
        "div#blue-box { border: 2px solid blue; }",
        "div#blue-box[data-123456] { border: 2px solid blue; }",
      );
      validateCss(
        "div#blue-box.block { border: 2px solid blue; }",
        "div#blue-box.block[data-123456] { border: 2px solid blue; }",
      );
    });

    it("scopes all non-pseudo selector", () => {
      validateCss(
        "div.content-container .button { cursor: crosshair; }",
        "div.content-container[data-123456] .button[data-123456] { cursor: crosshair; }",
      );
    });

    it("scopes multiple selector-lists", () => {
      validateCss(
        "div .button, div .button span { border-radius: 4px; }",
        "div[data-123456] .button[data-123456], div[data-123456] .button[data-123456] span[data-123456] { border-radius: 4px; }",
      );
    });

    it("scopes even with other data-selectors pressent", () => {
      validateCss(
        'div.container[data-x="test"] { color:green; }',
        'div.container[data-x="test"][data-123456] { color:green; }',
      );
      validateCss(
        '.block div.container[data-x="test"] { color:green; }',
        '.block[data-123456] div.container[data-x="test"][data-123456] { color:green; }',
      );
    });
  });

  describe("Deep selectors", () => {
    it("scopes child selectors correctly with deep", () => {
      validateCss(
        "p::deep > em { color: green; }",
        "p[data-123456] > em { color: green; }",
      );
    });

    it("scopes susequent selectors correctly with deep", () => {
      validateCss(
        "p::deep ~ em { color: green; }",
        "p[data-123456] ~ em { color: green; }",
      );
    });

    it("scopes selectors chain with deep correctly", () => {
      validateCss(
        "div.class1::deep.class2 { color: gold; }",
        "div.class1[data-123456].class2 { color: gold; }",
      );
    });

    it("scopes at ::deep selector and not deeper", () => {
      validateCss(
        ".content-container::deep span.nested { color: pink; }",
        ".content-container[data-123456] span.nested { color: pink; }",
      );
    });

    it("scopes at ::deep selector and not deeper using v-deep syntax", () => {
      validateCss(
        ".content-container::v-deep .nested2 { color: yellow; }",
        ".content-container[data-123456] .nested2 { color: yellow; }",
      );
    });

    it("scopes multiple selector-lists with and without ::deep selector", () => {
      validateCss(
        "div .button, div .button::deep span { border-radius: 4px; }",
        "div[data-123456] .button[data-123456], div[data-123456] .button[data-123456] span { border-radius: 4px; }",
      );

      validateCss(
        ".content-container::deep span.nested, .button span { color: pink; }",
        ".content-container[data-123456] span.nested, .button[data-123456] span[data-123456] { color: pink; }",
      );
    });
  });

  describe("Pseudo selectors", () => {
    it("scopes selectors chain with pseudo selectors in weird order", () => {
      validateCss(
        "a.anchor:active.class2 { color: pink; }",
        "a.anchor[data-123456]:active.class2[data-123456] { color: pink; }",
      );
    });

    it("scopes selectors chain with pseudo selectors with lots of chain", () => {
      validateCss(
        ".block span:not(.skeleton-image):not(.extra)::before { color: purple; }",
        ".block[data-123456] span[data-123456]:not(.skeleton-image):not(.extra)::before { color: purple; }",
      );
    });

    it("scopes selectors chain with pseudo selectors and classes at the end", () => {
      validateCss(
        ".block span:hover.win { color: green; }",
        ".block[data-123456] span[data-123456]:hover.win[data-123456] { color: green; }",
      );
    });
  });

  describe("Using media queries", () => {
    describe("Basic css", () => {
      it("scopes basic classes and elements", () => {
        validateCss(
          "@media only screen and (max-width: 962px) { .content-container { width: 962px; } div { background: green; } }",
          "@media only screen and (max-width: 962px) { .content-container[data-123456] { width: 962px; } div[data-123456] { background: green; } }",
        );
      });

      it("scopes adjecent sibiling selectors correctly", () => {
        validateCss(
          "@media only screen and (max-width: 962px) { h4 + p { color: green; } }",
          "@media only screen and (max-width: 962px) { h4[data-123456] + p[data-123456] { color: green; } }",
        );
      });

      it("scopes child selectors correctly", () => {
        validateCss(
          "@media only screen and (max-width: 962px) { p > em { color: green; } }",
          "@media only screen and (max-width: 962px) { p[data-123456] > em[data-123456] { color: green; } }",
        );
      });

      it("scopes id selectors correctly", () => {
        validateCss(
          "@media only screen and (max-width: 962px) { #content { border: 2px solid green; } div#blue-box { border: 2px solid blue; } }",
          "@media only screen and (max-width: 962px) { #content[data-123456] { border: 2px solid green; } div#blue-box[data-123456] { border: 2px solid blue; } }",
        );
      });

      it("scopes all non-psuedo selectors", () => {
        validateCss(
          "@media only screen and (max-width: 962px) { div.content-container .button { cursor: crosshair; } }",
          "@media only screen and (max-width: 962px) { div.content-container[data-123456] .button[data-123456] { cursor: crosshair; } }",
        );
      });

      it("scopes multiple selector-lists", () => {
        validateCss(
          "@media only screen and (max-width: 962px) { div .button, div .button span { border-radius: 4px; } }",
          "@media only screen and (max-width: 962px) { div[data-123456] .button[data-123456], div[data-123456] .button[data-123456] span[data-123456] { border-radius: 4px; } }",
        );
      });

      it("scopes even with other data-selectors pressent", () => {
        validateCss(
          '@media only screen and (max-width: 962px) { div.container[data-x="test"] { color:green; } }',
          '@media only screen and (max-width: 962px) { div.container[data-x="test"][data-123456] { color:green; } }',
        );
      });
    });

    describe("Deep selectors", () => {
      it("scopes at ::deep selector and not deeper", () => {
        validateCss(
          "@media only screen and (max-width: 962px) { .content-container::deep span.nested { color: pink; } }",
          "@media only screen and (max-width: 962px) { .content-container[data-123456] span.nested { color: pink; } }",
        );
      });

      it("scopes at ::deep selector and not deeper using v-deep syntax", () => {
        validateCss(
          "@media only screen and (max-width: 962px) { .content-container::v-deep .nested2 { color: yellow; } }",
          "@media only screen and (max-width: 962px) { .content-container[data-123456] .nested2 { color: yellow; } }",
        );
      });

      it("scopes multiple selector-lists with and without ::deep selector", () => {
        validateCss(
          "@media only screen and (max-width: 962px) { div .button, div .button::deep span { border-radius: 4px; } }",
          "@media only screen and (max-width: 962px) { div[data-123456] .button[data-123456], div[data-123456] .button[data-123456] span { border-radius: 4px; } }",
        );
      });
    });

    describe("Pseudo selectors", () => {
      it("scopes selectors chain with pseudo selectors in weird order", () => {
        validateCss(
          "@media only screen and (max-width: 962px) { a.anchor:active.class2 { color: pink; } }",
          "@media only screen and (max-width: 962px) { a.anchor[data-123456]:active.class2[data-123456] { color: pink; } }",
        );
      });

      it("scopes selectors chain with pseudo selectors with lots of chain", () => {
        validateCss(
          "@media only screen and (max-width: 962px) { .block span:not(.skeleton-image):not(.extra)::before { color: purple; } }",
          "@media only screen and (max-width: 962px) { .block[data-123456] span[data-123456]:not(.skeleton-image):not(.extra)::before { color: purple; } }",
        );
      });

      it("scopes selectors chain with pseudo selectors and classes at the end", () => {
        validateCss(
          ".block span:hover.win { color: green; }",
          ".block[data-123456] span[data-123456]:hover.win[data-123456] { color: green; }",
        );
      });
    });

    describe("Advanced media query cases", () => {
      it("scopes with multiple media query conditions", () => {
        validateCss(
          "@media only screen and (min-width: 480px) and (max-width: 962px) { .content-container { width: 962px; } div { background: green; } }",
          "@media only screen and (min-width: 480px) and (max-width: 962px) { .content-container[data-123456] { width: 962px; } div[data-123456] { background: green; } }",
        );
      });

      it("scopes with multiple media query conditions using or", () => {
        validateCss(
          "@media only screen and (min-width: 480px), tv and (max-width: 962px) { .content-container { width: 962px; } div { background: green; } }",
          "@media only screen and (min-width: 480px), tv and (max-width: 962px) { .content-container[data-123456] { width: 962px; } div[data-123456] { background: green; } }",
        );
      });

      it("scopes with recursive media query", () => {
        validateCss(
          "@media (min-width: 480px) { @media (min-width: 240px) { .content-container { width: 962px; } div { background: green; } } }",
          "@media (min-width: 480px) { @media (min-width: 240px) { .content-container[data-123456] { width: 962px; } div[data-123456] { background: green; } } }",
        );
      });
    });
  });

  describe("Using container queries", () => {
    it("scopes basic classes and elements", () => {
      validateCss(
        "@container (min-width: 100px) { .content-container { width: 962px; } div { background: green; } }",
        "@container (min-width: 100px) { .content-container[data-123456] { width: 962px; } div[data-123456] { background: green; } }",
      );
    });

    it("scopes named container queries", () => {
      validateCss(
        "@container sidebar (min-width: 100px) { span { color: red; } }",
        "@container sidebar (min-width: 100px) { span[data-123456] { color: red; } }",
      );
    });

    it("scopes container queries with multiple conditions", () => {
      validateCss(
        "@container sidebar (min-width: 100px) and (max-width: 200px) { .card { color: red; } }",
        "@container sidebar (min-width: 100px) and (max-width: 200px) { .card[data-123456] { color: red; } }",
      );
    });

    it("scopes negated container queries", () => {
      validateCss(
        "@container not (min-width: 100px) { .card { color: red; } }",
        "@container not (min-width: 100px) { .card[data-123456] { color: red; } }",
      );
    });

    it("scopes range container queries", () => {
      validateCss(
        "@container (width > 400px) { .card { color: red; } }",
        "@container (width > 400px) { .card[data-123456] { color: red; } }",
      );
    });

    it("scopes container style queries", () => {
      validateCss(
        "@container style(--theme: dark) { .card { color: white; } }",
        "@container style(--theme: dark) { .card[data-123456] { color: white; } }",
      );
    });

    it("scopes adjacent sibling selectors correctly", () => {
      validateCss(
        "@container (min-width: 100px) { h4 + p { color: green; } }",
        "@container (min-width: 100px) { h4[data-123456] + p[data-123456] { color: green; } }",
      );
    });

    it("scopes child selectors correctly", () => {
      validateCss(
        "@container (min-width: 100px) { p > em { color: green; } }",
        "@container (min-width: 100px) { p[data-123456] > em[data-123456] { color: green; } }",
      );
    });

    it("scopes subsequent selectors correctly", () => {
      validateCss(
        "@container (min-width: 100px) { p ~ em { color: green; } }",
        "@container (min-width: 100px) { p[data-123456] ~ em[data-123456] { color: green; } }",
      );
    });

    it("scopes id selectors correctly", () => {
      validateCss(
        "@container (min-width: 100px) { #content { border: 2px solid green; } div#blue-box { border: 2px solid blue; } }",
        "@container (min-width: 100px) { #content[data-123456] { border: 2px solid green; } div#blue-box[data-123456] { border: 2px solid blue; } }",
      );
    });

    it("scopes all non-pseudo selectors", () => {
      validateCss(
        "@container (min-width: 100px) { div.content-container .button { cursor: crosshair; } }",
        "@container (min-width: 100px) { div.content-container[data-123456] .button[data-123456] { cursor: crosshair; } }",
      );
    });

    it("scopes multiple selector-lists", () => {
      validateCss(
        "@container (min-width: 100px) { div .button, div .button span { border-radius: 4px; } }",
        "@container (min-width: 100px) { div[data-123456] .button[data-123456], div[data-123456] .button[data-123456] span[data-123456] { border-radius: 4px; } }",
      );
    });

    it("scopes even with other data-selectors present", () => {
      validateCss(
        '@container (min-width: 100px) { div.container[data-x="test"] { color: green; } }',
        '@container (min-width: 100px) { div.container[data-x="test"][data-123456] { color: green; } }',
      );
    });

    it("scopes at ::deep selector and not deeper", () => {
      validateCss(
        "@container (min-width: 100px) { .content-container::deep span.nested { color: pink; } }",
        "@container (min-width: 100px) { .content-container[data-123456] span.nested { color: pink; } }",
      );
    });

    it("scopes at ::v-deep selector and not deeper", () => {
      validateCss(
        "@container (min-width: 100px) { .content-container::v-deep .nested2 { color: yellow; } }",
        "@container (min-width: 100px) { .content-container[data-123456] .nested2 { color: yellow; } }",
      );
    });

    it("scopes selectors chain with pseudo selectors", () => {
      validateCss(
        "@container (min-width: 100px) { .block span:hover.win { color: green; } }",
        "@container (min-width: 100px) { .block[data-123456] span[data-123456]:hover.win[data-123456] { color: green; } }",
      );
    });

    it("scopes container queries nested in media queries", () => {
      validateCss(
        "@media (min-width: 100px) { @container sidebar (min-width: 50px) { span { color: red; } } }",
        "@media (min-width: 100px) { @container sidebar (min-width: 50px) { span[data-123456] { color: red; } } }",
      );
    });

    it("scopes media queries nested in container queries", () => {
      validateCss(
        "@container sidebar (min-width: 50px) { @media (min-width: 100px) { span { color: red; } } }",
        "@container sidebar (min-width: 50px) { @media (min-width: 100px) { span[data-123456] { color: red; } } }",
      );
    });

    it("scopes recursively nested container queries", () => {
      validateCss(
        "@container outer (min-width: 100px) { @container inner (min-width: 50px) { span { color: red; } } }",
        "@container outer (min-width: 100px) { @container inner (min-width: 50px) { span[data-123456] { color: red; } } }",
      );
    });

    it("scopes container queries nested in layers", () => {
      validateCss(
        "@layer components { @container sidebar (min-width: 100px) { .card { color: red; } } }",
        "@layer components { @container sidebar (min-width: 100px) { .card[data-123456] { color: red; } } }",
      );
    });

    it("scopes container queries regardless of casing", () => {
      validateCss(
        "@CONTAINER sidebar (min-width: 100px) { .card { color: red; } }",
        "@CONTAINER sidebar (min-width: 100px) { .card[data-123456] { color: red; } }",
      );
    });
  });

  describe("Other conditional group at-rules", () => {
    it("scopes @supports rules", () => {
      validateCss(
        "@supports (display: grid) { .grid { display: grid; } }",
        "@supports (display: grid) { .grid[data-123456] { display: grid; } }",
      );
    });

    it("scopes named @layer rules", () => {
      validateCss(
        "@layer base { .a { color: red; } }",
        "@layer base { .a[data-123456] { color: red; } }",
      );
    });

    it("scopes anonymous @layer rules", () => {
      validateCss(
        "@layer { .a { color: red; } }",
        "@layer { .a[data-123456] { color: red; } }",
      );
    });

    it("scopes @starting-style rules", () => {
      validateCss(
        "@starting-style { .a { opacity: 0; } }",
        "@starting-style { .a[data-123456] { opacity: 0; } }",
      );
    });

    it("scopes rules in @scope blocks", () => {
      validateCss(
        "@scope (.card) { .title { color: red; } }",
        "@scope (.card) { .title[data-123456] { color: red; } }",
      );
    });

    it("scopes rules nested through media, supports and container", () => {
      validateCss(
        "@media (min-width: 100px) { @supports (display: grid) { @container sidebar (min-width: 50px) { .a { display: grid; } } } }",
        "@media (min-width: 100px) { @supports (display: grid) { @container sidebar (min-width: 50px) { .a[data-123456] { display: grid; } } } }",
      );
    });

    it("scopes media queries nested in supports rules", () => {
      validateCss(
        "@supports (display: grid) { @media (min-width: 100px) { .a { display: grid; } } }",
        "@supports (display: grid) { @media (min-width: 100px) { .a[data-123456] { display: grid; } } }",
      );
    });

    it("scopes supports rules nested in layers", () => {
      validateCss(
        "@layer base { @supports (display: grid) { .a { display: grid; } } }",
        "@layer base { @supports (display: grid) { .a[data-123456] { display: grid; } } }",
      );
    });
  });

  describe("At-rules that must not be scoped", () => {
    it("does not scope keyframes selectors", () => {
      validateCss(
        "@keyframes spin { from { opacity: 0; } 50% { opacity: 0.5; } to { opacity: 1; } }",
        "@keyframes spin { from { opacity: 0; } 50% { opacity: 0.5; } to { opacity: 1; } }",
      );
    });

    it("does not scope vendor-prefixed keyframes selectors", () => {
      validateCss(
        "@-webkit-keyframes spin { from { opacity: 0; } to { opacity: 1; } }",
        "@-webkit-keyframes spin { from { opacity: 0; } to { opacity: 1; } }",
      );
    });

    it("does not scope keyframes regardless of casing", () => {
      validateCss(
        "@KEYFRAMES Spin { FROM { opacity: 0; } TO { opacity: 1; } }",
        "@KEYFRAMES Spin { FROM { opacity: 0; } TO { opacity: 1; } }",
      );
    });

    it("does not scope keyframes nested in media queries", () => {
      validateCss(
        "@media (min-width: 100px) { @keyframes fade { from { opacity: 0; } to { opacity: 1; } } .a { animation: fade 1s; } }",
        "@media (min-width: 100px) { @keyframes fade { from { opacity: 0; } to { opacity: 1; } } .a[data-123456] { animation: fade 1s; } }",
      );
    });

    it("does not scope keyframes nested in container queries", () => {
      validateCss(
        "@container sidebar (min-width: 100px) { @keyframes fade { from { opacity: 0; } to { opacity: 1; } } .a { animation: fade 1s; } }",
        "@container sidebar (min-width: 100px) { @keyframes fade { from { opacity: 0; } to { opacity: 1; } } .a[data-123456] { animation: fade 1s; } }",
      );
    });

    it("does not scope @font-face", () => {
      validateCss(
        '@font-face { font-family: "Test"; src: url("test.woff2") format("woff2"); }',
        '@font-face { font-family: "Test"; src: url("test.woff2") format("woff2"); }',
      );
    });

    it("does not scope @page", () => {
      validateCss(
        "@page :first { margin: 1cm; }",
        "@page :first { margin: 1cm; }",
      );
    });

    it("leaves @import untouched", () => {
      validateCss(
        '@import url("theme.css"); .a { color: red; }',
        '@import url("theme.css"); .a[data-123456] { color: red; }',
      );
    });
  });

  describe("General css regressions", () => {
    it("scopes multiple top-level rules", () => {
      validateCss(
        ".a { color: red; } .b { color: blue; }",
        ".a[data-123456] { color: red; } .b[data-123456] { color: blue; }",
      );
    });

    it("scopes rules that define and use custom properties", () => {
      validateCss(
        ".theme { --brand: red; } .a { color: var(--brand); }",
        ".theme[data-123456] { --brand: red; } .a[data-123456] { color: var(--brand); }",
      );
    });

    it("scopes universal selectors", () => {
      validateCss(
        "* { box-sizing: border-box; }",
        "*[data-123456] { box-sizing: border-box; }",
      );
    });

    it("scopes combined type, class and attribute selectors", () => {
      validateCss(
        'input.form-control[type="text"] { border: 1px solid grey; }',
        'input.form-control[type="text"][data-123456] { border: 1px solid grey; }',
      );
    });

    it("keeps declarations untouched while scoping selectors", () => {
      validateCss(
        ".a { content: '<div>'; margin: 0 auto; }",
        ".a[data-123456] { content: '<div>'; margin: 0 auto; }",
      );
    });
  });
});
