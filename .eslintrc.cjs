// @stokvel/config is a shared preset, not an eslint-config-* package, so ESLint's
// `extends` shorthand cannot load it by package name. Require it directly.
const preset = require('@stokvel/config');

module.exports = {
  root: true,
  ...preset,
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  ignorePatterns: ['node_modules/', 'dist/', '.next/', 'coverage/'],
  overrides: [
    {
      files: ['apps/web/**/*.{js,jsx,ts,tsx}'],
      env: {
        browser: true,
        es2022: true,
        node: true,
      },
    },
  ],
};
