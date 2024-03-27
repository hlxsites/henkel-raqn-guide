module.exports = {
  root: true,
  extends: ['airbnb-base', 'prettier'],
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'max-len': [2, 160, 2, { ignoreUrls: true }],
    'import/no-unresolved': [2, { commonjs: true }],
    'array-callback-return': 'off', // due to prettier
    'class-methods-use-this': 'off', // due to prettier
    'comma-dangle': ['error', 'always-multiline'], // due to prettier
    // allow reassigning param
    'no-param-reassign': [2, { props: false }],
    'linebreak-style': ['error', 'unix'],
    semi: [2, 'always'],
    quotes: [2, 'single', { avoidEscape: true }],
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
    'import/extensions': [
      'error',
      {
        js: 'always',
      },
    ],
  },
};
