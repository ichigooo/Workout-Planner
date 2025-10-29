// @ts-check
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactNative from "eslint-plugin-react-native";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
    // Ignore build artifacts
    {
        ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**", "android/**", "ios/**"],
    },

    // JavaScript recommended
    js.configs.recommended,

    // TypeScript recommended (non type-checked; safer/faster)
    ...tseslint.configs.recommended,

    // React/React Native + Hooks
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                jest: true,
            },
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            react,
            "react-hooks": reactHooks,
            "react-native": reactNative,
            "prettier": eslintPluginPrettier,
        },
        settings: {
            react: { version: "detect" },
        },
        rules: {
            // React
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,

            // React Native extras (tune as you like)
            "react-native/no-unused-styles": "off",
            "react-native/no-inline-styles": "off",
            "react-native/no-single-element-style-arrays": "warn",

            // Your style choices
            "quotes": ["error", "double", { avoidEscape: true }],
            "jsx-quotes": ["error", "prefer-double"],

            // Run Prettier as an ESLint rule
            "prettier/prettier": "error",

            // Modern React (automatic JSX runtime)
            "react/react-in-jsx-scope": "off",
            // Allow apostrophes/quotes in copy strings
            "react/no-unescaped-entities": "off",

            // Loosen TS strictness for now
            "@typescript-eslint/no-explicit-any": "off",
            // Unused vars -> warn; ignore underscores and common caught error names
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^(e|_)$",
                },
            ],
            // Allow require() in RN/Expo configs
            "@typescript-eslint/no-require-imports": "off",
            // Permit empty catch blocks
            "no-empty": ["error", { allowEmptyCatch: true }],
            // Some setups include this; relax it
            "react-hooks/purity": "off",
        },
    },

    // Turn off ESLint rules that conflict with Prettier
    { rules: { ...eslintConfigPrettier.rules } },

    // Disable TypeScript-specific rules for plain JS files
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: "script", // CommonJS-style JS
            globals: {
                ...globals.node,
                ...globals.browser,
            },
        },
        rules: {
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-var-requires": "off",
        },
    },

    // Test files (Mocha/Jest globals & relaxed assertions)
    {
        files: ["backend/test/**/*.{js,ts}", "**/__tests__/**/*.{js,ts,tsx}"],
        languageOptions: {
            globals: {
                ...globals.mocha,
                describe: "readonly",
                it: "readonly",
                expect: "readonly",
            },
        },
        rules: {
            "@typescript-eslint/no-unused-expressions": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^(e|_)$",
                },
            ],
        },
    },
];
