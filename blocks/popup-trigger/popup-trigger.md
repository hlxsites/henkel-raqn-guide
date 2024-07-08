# Popup Trigger

## Description

A component which generates a button used to:
1. open a pop-up.
2. close the currently active popup

See [popup](../popup/popup.md) component.

## Block Name

`n/a`

## Support as a Block

This component is not supported as a block. It's only used as a nested component for [button](../button/button.md)

## Block Options

`N/A`

## WebComponent Tag
### `<raqn-popup-trigger></raqn-popup-trigger>`

## Initialization

### Initialization rule for generated EDS Blocks

#### 1. Prerequisite

The [rules for the button](../button/button.md#initialization-rule-for-generated-eds-blocks) component must be met as the pop-up trigger is a nested component of the button.

All other features of the button component are still available.

#### 2. Initialization as nested component

If the button component rules were met, the popup trigger component will match any anchor (`<a>`) with a `href` where the href ends with one the following hashes `#popup-trigger` or `#popup-close`.

When `#popup-trigger` hash is used, the url of the anchor will be used to load the pop-up content from that url.

## Editorial Initializations (in MS Word)

### 1. Open a popup
The popup content will be loaded from the url provided in the anchor configured with the `#popup-trigger` hash.

Example: 

`https://example.com/page-with-the-popup-content#popup-trigger`


### 2. Close the currently open popup

In this case the url or the current page can be used on the anchor because the url will be ignored. Only the `#popup-close` hash of the url is important.

Example: 

`https://example.com/current-page#popup-close`



