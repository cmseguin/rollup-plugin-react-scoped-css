import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/__mocks__/**",
      "**/dist/**",
      "**/e2e/**",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
      },
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
      "@typescript-eslint": typescriptPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      "react/jsx-filename-extension": [1, { extensions: [".jsx", ".tsx"] }],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    ignores: [
      "**/node_modules/**",
      "**/__mocks__/**",
      "**/dist/**",
      "**/e2e/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
    },
    rules: {},
    ignores: [
      "**/node_modules/**",
      "**/__mocks__/**",
      "**/dist/**",
      "**/e2e/**",
    ],
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {},
    rules: {},
    ignores: [
      "**/node_modules/**",
      "**/__mocks__/**",
      "**/dist/**",
      "**/e2e/**",
    ],
  },
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error", // Enforce Prettier formatting
    },
    ignores: [
      "**/node_modules/**",
      "**/__mocks__/**",
      "**/dist/**",
      "**/e2e/**",
    ],
  },
];
