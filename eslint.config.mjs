import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "**/out/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/public/sw.js",
      "**/node_modules/**",
      "**/src/generated/**",
      "**/public/swe-worker-*.js",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
