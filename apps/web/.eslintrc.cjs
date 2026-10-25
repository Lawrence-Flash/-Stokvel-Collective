// Next.js lint resolves config from this app. Keep the shared preset and add the
// matching eslint-config-next ruleset for Next 15.
const preset = require('@stokvel/config');

module.exports = {
  root: true,
  parser: preset.parser,
  plugins: preset.plugins,
  extends: [...preset.extends, 'next/core-web-vitals'],
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  ignorePatterns: ['node_modules/', 'dist/', '.next/', 'coverage/'],
  rules: preset.rules,
};
