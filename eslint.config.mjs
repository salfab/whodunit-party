// Minimal flat config to avoid FlatCompat circular reference bug
// TODO: Migrate to full flat config when next/eslint-config-next fully supports ESLint 9 flat config
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";

export default [
  { ignores: [".next", "node_modules", "out", "dist", ".turbo", "cypress.config.ts", "vitest.config.mts"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: "readonly",
        fetch: "readonly",
        URL: "readonly",
        File: "readonly",
        Blob: "readonly",
        FormData: "readonly",
        Headers: "readonly",
        Request: "readonly",
        RequestInfo: "readonly",
        RequestInit: "readonly",
        Response: "readonly",
        localStorage: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        JQuery: "readonly",
        atob: "readonly",
        crypto: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        AbortController: "readonly",
        process: "readonly",
        console: "readonly",
        window: "readonly",
        TextEncoder: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    files: ["scripts/**/*.mjs", "check-images.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        Blob: "readonly",
        FormData: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": "warn",
    },
  },
  {
    files: ["cypress/**/*.ts"],
    languageOptions: {
      globals: {
        cy: "readonly",
        Cypress: "readonly",
        expect: "readonly",
        describe: "readonly",
        it: "readonly",
        beforeEach: "readonly",
        Given: "readonly",
        When: "readonly",
        Then: "readonly",
        And: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },
];
