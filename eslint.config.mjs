import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  globalIgnores([".next/**", "node_modules/**", "out/**", "public/sw.js"]),
  nextCoreWebVitals,
  nextTypescript,
]);

export default eslintConfig;
