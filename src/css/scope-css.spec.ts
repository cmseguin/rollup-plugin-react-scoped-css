import { parse, generate } from "css-tree";
import { scopeCss } from "./scope-css";

const validateCss = (inputCss, expectedScopedCss) => {
  const result = scopeCss(inputCss, "test.scoped.css", "data-v-123456");
  const expectedResult = generate(parse(expectedScopedCss));

  expect(result).toBe(expectedResult);
};

describe("scope-css", () => {
  it("should scope basic classes and elements", () => {
    validateCss(
      ".content-container { width: 962px; } div { background: green; }",
      ".content-container[data-v-123456] { width: 962px; } div[data-v-123456] { background: green; }"
    );
  });

  it("should scope adjecent sibiling selectors correctly", () => {
    validateCss(
      "h4 + p { color: green; }",
      "h4[data-v-123456] + p[data-v-123456] { color: green; }"
    );
  });

  it("should scope child selectors correctly", () => {
    validateCss(
      "p > em { color: green; }",
      "p[data-v-123456] > em[data-v-123456] { color: green; }"
    );
  });

  it("should scope id selectors correctly", () => {
    validateCss(
      "#content { border: 2px solid green; }",
      "#content[data-v-123456] { border: 2px solid green; }"
    );
    validateCss(
      "div#blue-box { border: 2px solid blue; }",
      "div#blue-box[data-v-123456] { border: 2px solid blue; }"
    );
    validateCss(
      "div#blue-box.block { border: 2px solid blue; }",
      "div#blue-box.block[data-v-123456] { border: 2px solid blue; }"
    );
  });

  it("should scope all non-pseudo selector", () => {
    validateCss(
      "div.content-container .button { cursor: crosshair; }",
      "div.content-container[data-v-123456] .button[data-v-123456] { cursor: crosshair; }"
    );
  });

  it("should scope at ::deep selector and not deeper", () => {
    validateCss(
      ".content-container::deep span.nested { color: pink; }",
      ".content-container[data-v-123456] span.nested { color: pink; }"
    );
  });

  it("should scope at ::deep selector and not deeper using v-deep syntax", () => {
    validateCss(
      ".content-container::v-deep .nested2 { color: yellow; }",
      ".content-container[data-v-123456] .nested2 { color: yellow; }"
    );
  });

  it("should scope multiple selector-lists", () => {
    validateCss(
      "div .button, div .button span { border-radius: 4px; }",
      "div[data-v-123456] .button[data-v-123456], div[data-v-123456] .button[data-v-123456] span[data-v-123456] { border-radius: 4px; }"
    );
  });

  it("should scope multiple selector-lists with and without ::deep selector", () => {
    validateCss(
      "div .button, div .button::deep span { border-radius: 4px; }",
      "div[data-v-123456] .button[data-v-123456], div[data-v-123456] .button[data-v-123456] span { border-radius: 4px; }"
    );
  });

  it("should scope even with other data-selectors pressent", () => {
    validateCss(
      'div.container[data-x="test"] { color:green; }',
      'div.container[data-x="test"][data-v-123456] { color:green; }'
    );
    validateCss(
      '.block div.container[data-x="test"] { color:green; }',
      '.block[data-v-123456] div.container[data-x="test"][data-v-123456] { color:green; }'
    );
  });

  describe("using media queries", () => {
    it("should scope basic classes and elements", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { .content-container { width: 962px; } div { background: green; } }",
        "@media only screen and (max-width: 962px) { .content-container[data-v-123456] { width: 962px; } div[data-v-123456] { background: green; } }"
      );
    });

    it("should scope adjecent sibiling selectors correctly", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { h4 + p { color: green; } }",
        "@media only screen and (max-width: 962px) { h4[data-v-123456] + p[data-v-123456] { color: green; } }"
      );
    });

    it("should scope child selectors correctly", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { p > em { color: green; } }",
        "@media only screen and (max-width: 962px) { p[data-v-123456] > em[data-v-123456] { color: green; } }"
      );
    });

    it("should scope id selectors correctly", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { #content { border: 2px solid green; } div#blue-box { border: 2px solid blue; } }",
        "@media only screen and (max-width: 962px) { #content[data-v-123456] { border: 2px solid green; } div#blue-box[data-v-123456] { border: 2px solid blue; } }"
      );
    });

    it("should scope all non-psuedo selectors", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { div.content-container .button { cursor: crosshair; } }",
        "@media only screen and (max-width: 962px) { div.content-container[data-v-123456] .button[data-v-123456] { cursor: crosshair; } }"
      );
    });

    it("should scope at ::deep selector and not deeper", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { .content-container::deep span.nested { color: pink; } }",
        "@media only screen and (max-width: 962px) { .content-container[data-v-123456] span.nested { color: pink; } }"
      );
    });

    it("should scope at ::deep selector and not deeper using v-deep syntax", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { .content-container::v-deep .nested2 { color: yellow; } }",
        "@media only screen and (max-width: 962px) { .content-container[data-v-123456] .nested2 { color: yellow; } }"
      );
    });

    it("should scope multiple selector-lists", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { div .button, div .button span { border-radius: 4px; } }",
        "@media only screen and (max-width: 962px) { div[data-v-123456] .button[data-v-123456], div[data-v-123456] .button[data-v-123456] span[data-v-123456] { border-radius: 4px; } }"
      );
    });

    it("should scope even with other data-selectors pressent", () => {
      validateCss(
        'div.container[data-x="test"] { color:green; }',
        'div.container[data-x="test"][data-v-123456] { color:green; }'
      );
    });

    it("should scope multiple selector-lists with and without ::deep selector", () => {
      validateCss(
        "@media only screen and (max-width: 962px) { div .button, div .button::deep span { border-radius: 4px; } }",
        "@media only screen and (max-width: 962px) { div[data-v-123456] .button[data-v-123456], div[data-v-123456] .button[data-v-123456] span { border-radius: 4px; } }"
      );
    });

    it("should scope with multiple media query conditions", () => {
      validateCss(
        "@media only screen and (min-width: 480px) and (max-width: 962px) { .content-container { width: 962px; } div { background: green; } }",
        "@media only screen and (min-width: 480px) and (max-width: 962px) { .content-container[data-v-123456] { width: 962px; } div[data-v-123456] { background: green; } }"
      );
    });

    it("should scope with multiple media query conditions using or", () => {
      validateCss(
        "@media only screen and (min-width: 480px), tv and (max-width: 962px) { .content-container { width: 962px; } div { background: green; } }",
        "@media only screen and (min-width: 480px), tv and (max-width: 962px) { .content-container[data-v-123456] { width: 962px; } div[data-v-123456] { background: green; } }"
      );
    });
  });
});
