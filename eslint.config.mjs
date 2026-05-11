import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  globalIgnores([
    // build outputs
    "**/dist/**",
    "**/build/**",
    "**/.turbo/**",

    // dependencies
    "**/node_modules/**",

    // terraform
    "infrastructure/**",

    // migration script outputs
    "scripts/**",
  ]),
]);

export default eslintConfig;