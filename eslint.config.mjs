// ESLint Flat Configuration
// TypeScript and WebPieces configurations

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import webpiecesConfig from './eslint.webpieces.config.mjs';
import noJsonPropertyPrimitiveType from './tools/eslint-rules/no-json-property-primitive-type.mjs';

export default [
    // WebPieces ESLint rules (no-unmanaged-exceptions, catch-error-pattern, etc.)
    ...webpiecesConfig,
    // TypeScript files configuration
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                ...globals.node,
                ...globals.browser,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            // TypeScript rules
            '@typescript-eslint/no-inferrable-types': 'off',
        },
    },

    // Ban @JsonProperty({ type: String/Number/Boolean }) — breaks production deserialization
    {
        files: ['**/*.ts'],
        plugins: {
            'custom-json-property': {
                rules: {
                    'no-primitive-type': noJsonPropertyPrimitiveType,
                },
            },
        },
        rules: {
            'custom-json-property/no-primitive-type': 'error',
        },
    },

    // JavaScript files configuration
    {
        files: ['**/*.js', '**/*.jsx'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
    },

    // Test files: Jest globals
    {
        files: [
            '**/*.spec.ts',
            '**/*.spec.tsx',
            '**/*.spec.js',
            '**/*.spec.jsx',
            '**/*.test.ts',
            '**/*.test.js',
        ],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
    },
];
