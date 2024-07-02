# Popup
## Description
A component to generates a pop-up which fetches content from a provided content fragment url.

It can be styled as a modal or a flyout.

A [popup-trigger](../popup/popup-trigger.md) component is used to generate and open a popup.

## Block Name

`Popup`

The name is case insensitive.
## Support as a Block
The component has partial support as a block.
It should not be used as a block until a new component/feature (popup opener) with triggers when the popup should be opened/closed is implemented.

The popup block should not have content, instead an anchor can be placed in the block which will be used as a value for the `url` option.

Currently if used as a block with the active option set to
- `false`, the component will be on the page but never opened because there is no trigger.
- `true` the popup will always open on page load with no way to stop it.

## Block Options

| Option | Value | Default | Description | Note |
|-|-|-|-|-|
| `url` | `url.pathname` | `n/a` | A relative url to the source page of the popup content | - Value is passed by [popup-trigger](../popup/popup-trigger.md) component it's generating the popup.<br> - Value is taken from the first anchor in the body of the popup block |
| `active` | `boolean` | `false` | Set the open/close state of the pop-up. | Value is passed by [config-popup](./config-popup.md) block. |
| `type` | `modal` or `flyout` | `modal` | Sets the visual style of the popup. | Value is passed by [config-popup](./config-popup.md) block. |
| `size` | `1` to `12` | `10` | Sets the width of the popup based on a 12 columns grid. | Value is passed by [config-popup](./config-popup.md) block. |
| `offset` | `1` to `12` | `2` | Changes the horizontal alignment of the popup based on a 12 columns grid. | Value is passed by [config-popup](./config-popup.md) block. |
| `height` | `px` or `vh` | `80vh` | Set the maximum height of the popup. The unit is required with the number. | Value is passed by [config-popup](./config-popup.md) block. |
|`config`| external config name | `n/a`| * Not testes. Do not use! |

## WebComponent Tag
### `<raqn-popup></raqn-popup>`

## Use cases

### Initialization rule for generated EDS Blocks
The component loader matches any element on the page with a `.popup` css class on it.

#### 2. Initialization from code
Generate in the codebase inside other component (e.g. popup-trigger) using the component loader.


## Editorial Guide
### 1. Create a popup trigger
Use the [popup-trigger](../popup-trigger/popup-trigger.md).

### 2. Create pop-up fragment content page.
Add any content on a page and set the URL to a [popup-trigger](../popup-trigger/popup-trigger.md).

### 3. Optionally add popup config using config-popup.
On the sept 2, at the bottom of the popup fragment content page add [config-popup](./config-popup.md) block and set the configuration 

