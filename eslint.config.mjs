import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow intentionally-unused destructured vars prefixed with `_`
      // (used for the DTO pattern in src/data/jobs.ts: stripping a
      // joined relation before returning the row to a caller).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored, unminified-but-generated Draco decoder (copied verbatim
    // from three's own examples so decoding works without an external CDN
    // dependency) — not our code, not meant to be linted.
    "public/draco/**",
  ]),
]);

export default eslintConfig;
