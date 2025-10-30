import nextConfig from "eslint-config-next";
import gitignore from "eslint-config-flat-gitignore";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = [
	gitignore(),
	...nextConfig,
	eslintConfigPrettier,
	{
		rules: {
			"react-hooks/incompatible-library": "off"
		}
	}
];

export default eslintConfig;
