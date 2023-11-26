module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended','prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'html', 'simple-import-sort'],
  ignorePatterns: ['dist/*'],
  rules: {
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "@typescript-eslint/no-empty-function" : 0,
  },
  env: {
    jest: true,
    browser: false,
    node: true,
  },
  root: true,
};