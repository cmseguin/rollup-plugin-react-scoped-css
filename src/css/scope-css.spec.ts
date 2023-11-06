import {
  parse,
  generate,
} from "css-tree";
import { scopeCss } from "./scope-css";

const validateCss = (inputCss, expectedScopedCss) => {
  const result = scopeCss(inputCss, "test.scoped.css", "data-v-123456");
  const expectedResult = generate(parse(expectedScopedCss));

  expect(result).toBe(expectedResult);
}

describe("scope-css", () => {
  it("should scope basic classes and elements", async () => {
    validateCss(
      '.content-container { width: 962px; } div { background: green; }',
      '.content-container[data-v-123456] { width: 962px; } div[data-v-123456] { background: green; }'
    );
  });

  it("should scope last selector", async () => {
    validateCss(
      'div.content-container .button { cursor: crosshair; }',
      'div.content-container .button[data-v-123456] { cursor: crosshair; }'
    );
  });

  it("should scope at ::deep selector and not deeper", async () => {
    validateCss(
      '.content-container::deep span.nested { color: pink; }',
      '.content-container[data-v-123456] span.nested { color: pink; }'
    );
  });

  it("should scope at ::deep selector and not deeper using v-deep syntax", async () => {
    validateCss(
      '.content-container::v-deep .nested2 { color: yellow; }',
      '.content-container[data-v-123456] .nested2 { color: yellow; }'
    );
  });

  it("should scope multiple selector-lists", async () => {
    validateCss(
      'div .button, div .button span { border-radius: 4px; }',
      'div .button[data-v-123456], div .button span[data-v-123456] { border-radius: 4px; }'
    );
  });

  it("should scope multiple selector-lists with and without ::deep selector", async () => {
    validateCss(
      'div .button, div .button::deep span { border-radius: 4px; }',
      'div .button[data-v-123456], div .button[data-v-123456] span { border-radius: 4px; }'
    );
  });

  describe("using media queries", () => {
    it("should scope basic classes and elements", async () => {
      validateCss(
        '@media only screen and (max-width: 962px) { .content-container { width: 962px; } div { background: green; } }',
        '@media only screen and (max-width: 962px) { .content-container[data-v-123456] { width: 962px; } div[data-v-123456] { background: green; } }'
      );
    });

    it("should scope last selector", async () => {
      validateCss(
        '@media only screen and (max-width: 962px) { div.content-container .button { cursor: crosshair; } }',
        '@media only screen and (max-width: 962px) { div.content-container .button[data-v-123456] { cursor: crosshair; } }'
      );
    });

    it("should scope at ::deep selector and not deeper", async () => {
      validateCss(
        '@media only screen and (max-width: 962px) { .content-container::deep span.nested { color: pink; } }',
        '@media only screen and (max-width: 962px) { .content-container[data-v-123456] span.nested { color: pink; } }'
      );
    });

    it("should scope at ::deep selector and not deeper using v-deep syntax", async () => {
      validateCss(
        '@media only screen and (max-width: 962px) { .content-container::v-deep .nested2 { color: yellow; } }',
        '@media only screen and (max-width: 962px) { .content-container[data-v-123456] .nested2 { color: yellow; } }'
      );
    });

    it("should scope multiple selector-lists", async () => {
      validateCss(
        '@media only screen and (max-width: 962px) { div .button, div .button span { border-radius: 4px; } }',
        '@media only screen and (max-width: 962px) { div .button[data-v-123456], div .button span[data-v-123456] { border-radius: 4px; } }'
      );
    });

    it("should scope multiple selector-lists with and without ::deep selector", async () => {
      validateCss(
        '@media only screen and (max-width: 962px) { div .button, div .button::deep span { border-radius: 4px; } }',
        '@media only screen and (max-width: 962px) { div .button[data-v-123456], div .button[data-v-123456] span { border-radius: 4px; } }'
      );
    });

    it("should scope with multiple media query conditions", async () => {
      validateCss(
        '@media only screen and (min-width: 480px) and (max-width: 962px) { .content-container { width: 962px; } div { background: green; } }',
        '@media only screen and (min-width: 480px) and (max-width: 962px) { .content-container[data-v-123456] { width: 962px; } div[data-v-123456] { background: green; } }'
      );
    });

    it("should scope with multiple media query conditions using or", async () => {
      validateCss(
        '@media only screen and (min-width: 480px), tv and (max-width: 962px) { .content-container { width: 962px; } div { background: green; } }',
        '@media only screen and (min-width: 480px), tv and (max-width: 962px) { .content-container[data-v-123456] { width: 962px; } div[data-v-123456] { background: green; } }'
      );
    });
  });
});
