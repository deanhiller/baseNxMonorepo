// ESLint Flat Configuration
// TypeScript and WebPieces configurations

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import webpiecesConfig from './eslint.webpieces.config.mjs';
import angularConfig from './eslint.webpieces-angular.config.mjs';

export default [

    // WebPieces ESLint rules (no-unmanaged-exceptions, catch-error-pattern, etc.)
    ...webpiecesConfig,
    // Angular-specific rules (template rules, no-console, signal bans, etc.)
    ...angularConfig,
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
