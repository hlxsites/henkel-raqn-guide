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
    'comma-dangle': 'always-multiline', // due to prettier
    // allow reassigning param
    'no-param-reassign': [2, { props: false }],
    'linebreak-style': ['error', 'unix'],
    'import/extensions': [
      'error',
      {
        js: 'always',
      },
    ],
  },
};
