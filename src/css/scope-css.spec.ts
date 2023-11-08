import { parse, generate } from "css-tree";
import { scopeCss } from "./scope-css";

const validateCss = (inputCss, expectedScopedCss) => {
  const result = scopeCss(inputCss, "test.scoped.css", "data-123456");
  const expectedResult = generate(parse(expectedScopedCss));

  expect(result).toBe(expectedResult);
};

describe("scope-css", () => {
  it("scopes basic classes and elements", () => {
    validateCss(
      ".content-container { width: 962px; } div { background: green; }",
      ".content-container[data-123456] { width: 962px; } div[data-123456] { background: green; }"
    );
  });

  it("scopes adjecent sibiling selectors correctly", () => {
    validateCss(
      "h4 + p { color: green; }",
      "h4[data-123456] + p[data-123456] { color: green; }"
    );
  });

  it("scopes child selectors correctly", () => {
    validateCss(
      "p > em { color: green; }",
      "p[data-123456] > em[data-123456] { color: green; }"
    );
  });

  it("scopes child selectors correctly with deep", () => {
    validateCss(
      "p::deep > em { color: green; }",
      "p[data-123456] > em { color: green; }"
    );
  });

  it("scopes susequent selectors correctly", () => {
    validateCss(
      "p ~ em { color: green; }",
      "p[data-123456] ~ em[data-123456] { color: green; }"
    );
  });

  it("scopes susequent selectors correctly with deep", () => {
    validateCss(
      "p::deep ~ em { color: green; }",
      "p[data-123456] ~ em { color: green; }"
    );
  });

  it("scopes selectors chain with deep correctly", () => {
    validateCss(
      "div.class1::deep.class2 { color: gold; }",
      "div.class1[data-123456].class2 { color: gold; }"
    );
  });

  it("scopes selectors chain with pseudo selectors in weird order", () => {
    validateCss(
      "a.anchor:active.class2 { color: pink; }",
      "a.anchor[data-123456]:active.class2[data-123456] { color: pink; }"
    );
  });

  it("scopes selectors chain with pseudo selectors with lots of chain", () => {
    validateCss(
      ".tire .eu-labels .eu-label span:not(.skeleton-image):not(.extra)::before { color: purple; }",
      ".tire[data-123456] .eu-labels[data-123456] .eu-label[data-123456] span[data-123456]:not(.skeleton-image):not(.extra)::before { color: purple; }"
    );
  });

  it("scopes id selectors correctly", () => {
    validateCss(
      "#content { border: 2px solid green; }",
      "#content[data-123456] { border: 2px solid green; }"
    );
    validateCss(
      "div#blue-box { border: 2px solid blue; }",
      "div#blue-box[data-123456] { border: 2px solid blue; }"
    );
    validateCss(
      "div#blue-box.block { border: 2px solid blue; }",
      "div#blue-box.block[data-123456] { border: 2px solid blue; }"
    );
  });

  it("scopes all non-pseudo selector", () => {
    validateCss(
      "div.content-container .button { cursor: crosshair; }",
      "div.content-container[data-123456] .button[data-123456] { cursor: crosshair; }"
    );
  });

  it("scopes at ::deep selector and not deeper", () => {
    validateCss(
      ".content-container::deep span.nested { color: pink; }",
      ".content-container[data-123456] span.nested { color: pink; }"
    );
  });

  it("scopes at ::deep selector and not deeper using v-deep syntax", () => {
    validateCss(
      ".content-container::v-deep .nested2 { color: yellow; }",
      ".content-container[data-123456] .nested2 { color: yellow; }"
    );
  });

  it("scopes multiple selector-lists", () => {
    validateCss(
      "div .button, div .button span { border-radius: 4px; }",
      "div[data-123456] .button[data-123456], div[data-123456] .button[data-123456] span[data-123456] { border-radius: 4px; }"
    );
  });

  it("scopes multiple selector-lists with and without ::deep selector", () => {
    validateCss(
      "div .button, div .button::deep span { border-radius: 4px; }",
      "div[data-123456] .button[data-123456], div[data-123456] .button[data-123456] span { border-radius: 4px; }"
    );

    validateCss(
      ".content-container::deep span.nested, .button span { color: pink; }",
      ".content-container[data-123456] span.nested, .button[data-123456] span[data-123456] { color: pink; }"
    );
  });

  it("scopes even with other data-selectors pressent", () => {
    validateCss(
      'div.container[data-x="test"] { color:green; }',
      'div.container[data-x="test"][data-123456] { color:green; }'
    );
    validateCss(
      '.block div.container[data-x="test"] { color:green; }',
      '.block[data-123456] div.container[data-x="test"][data-123456] { color:green; }'
    );
  });

  describe("using media queries", () => {
    it("scopes basic classes and elements", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { .content-container { width: 962px; } div { background: green; } }",
        "@media only screen and (max-width: 962px) { .content-container[data-123456] { width: 962px; } div[data-123456] { background: green; } }"
      );
    });

    it("scopes adjecent sibiling selectors correctly", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { h4 + p { color: green; } }",
        "@media only screen and (max-width: 962px) { h4[data-123456] + p[data-123456] { color: green; } }"
      );
    });

    it("scopes child selectors correctly", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { p > em { color: green; } }",
        "@media only screen and (max-width: 962px) { p[data-123456] > em[data-123456] { color: green; } }"
      );
    });

    it("scopes id selectors correctly", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { #content { border: 2px solid green; } div#blue-box { border: 2px solid blue; } }",
        "@media only screen and (max-width: 962px) { #content[data-123456] { border: 2px solid green; } div#blue-box[data-123456] { border: 2px solid blue; } }"
      );
    });

    it("scopes all non-psuedo selectors", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { div.content-container .button { cursor: crosshair; } }",
        "@media only screen and (max-width: 962px) { div.content-container[data-123456] .button[data-123456] { cursor: crosshair; } }"
      );
    });

    it("scopes at ::deep selector and not deeper", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { .content-container::deep span.nested { color: pink; } }",
        "@media only screen and (max-width: 962px) { .content-container[data-123456] span.nested { color: pink; } }"
      );
    });

    it("scopes at ::deep selector and not deeper using v-deep syntax", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { .content-container::v-deep .nested2 { color: yellow; } }",
        "@media only screen and (max-width: 962px) { .content-container[data-123456] .nested2 { color: yellow; } }"
      );
    });

    it("scopes multiple selector-lists", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { div .button, div .button span { border-radius: 4px; } }",
        "@media only screen and (max-width: 962px) { div[data-123456] .button[data-123456], div[data-123456] .button[data-123456] span[data-123456] { border-radius: 4px; } }"
      );
    });

    it("scopes even with other data-selectors pressent", () => {
      validateCss(
        '@media only screen and (max-width: 962px) { div.container[data-x="test"] { color:green; } }',
        '@media only screen and (max-width: 962px) { div.container[data-x="test"][data-123456] { color:green; } }'
      );
    });

    it("scopes multiple selector-lists with and without ::deep selector", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { div .button, div .button::deep span { border-radius: 4px; } }",
        "@media only screen and (max-width: 962px) { div[data-123456] .button[data-123456], div[data-123456] .button[data-123456] span { border-radius: 4px; } }"
      );
    });

    it("scopes with multiple media query conditions", () => {
      validateCss(
        "@media only screen and (min-width: 480px) and (max-width: 962px) { .content-container { width: 962px; } div { background: green; } }",
        "@media only screen and (min-width: 480px) and (max-width: 962px) { .content-container[data-123456] { width: 962px; } div[data-123456] { background: green; } }"
      );
    });

    it("scopes with multiple media query conditions using or", () => {
      validateCss(
        "@media only screen and (min-width: 480px), tv and (max-width: 962px) { .content-container { width: 962px; } div { background: green; } }",
        "@media only screen and (min-width: 480px), tv and (max-width: 962px) { .content-container[data-123456] { width: 962px; } div[data-123456] { background: green; } }"
      );
    });

    it("scopes with recursive media query", () => {
      validateCss(
        "@media (min-width: 480px) { @media (min-width: 240px) { .content-container { width: 962px; } div { background: green; } } }",
        "@media (min-width: 480px) { @media (min-width: 240px) { .content-container[data-123456] { width: 962px; } div[data-123456] { background: green; } } }"
      );
    });
  });
});
