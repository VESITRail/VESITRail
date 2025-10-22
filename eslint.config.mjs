import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import gitignore from "eslint-config-flat-gitignore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  gitignore(),
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
