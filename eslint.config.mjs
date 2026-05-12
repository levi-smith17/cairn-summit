import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  globalIgnores([
    // build outputs.tf
    "**/dist/**",
    "**/build/**",
    "**/.turbo/**",

    // dependencies
    "**/node_modules/**",

    // terraform
    "infrastructure/**",

    // migration script outputs.tf
    "scripts/**",
  ]),
]);

export default eslintConfig;