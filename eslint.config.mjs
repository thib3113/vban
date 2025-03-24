import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import typescriptParser from '@typescript-eslint/parser';
import { globalIgnores } from 'eslint/config';

export default tseslint.config(
    eslintPluginPrettierRecommended,
    eslintConfigPrettier,
    globalIgnores(['node_modules', 'lib', '*.hbs', '*.md', '*.html']),
    {
        languageOptions: {
            parser: typescriptParser,
            ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
            sourceType: 'module' // Allows for the use of imports
        },
        rules: {
            camelcase: 'off',
            '@typescript-eslint/camelcase': 'off',
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            indent: 'off', //prettier take it in charge
            '@typescript-eslint/no-object-literal-type-assertion': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/ban-ts-ignore': 'off'
        }
    }
);
