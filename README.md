# Henkel RAQN Guide

PoC / Migration project to experiment with EDS in the RAQN world.

## Environments

- Preview: https://main--raqn-docs-sharepoint--henkel.aem.page/
- Live: https://main--raqn-docs-sharepoint--henkel.aem.live/

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
npm run lint:fix
```

## Local development

1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM EDS Proxy: `aem up --url <domain of site you are developing, e.g. https://main--raqn-developers--henkel.aem.page/>` (opens your browser at `http://localhost:3000`)
1. Open the `henkel-raqn-guide` directory in your favorite IDE and start coding :)

## Documentation

[Documentation](docs/readme.md)
