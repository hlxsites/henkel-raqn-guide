# Config Popup

## Description

A non functional block used to provide configuration for a [popup](./popup.md) component when placed on the content source page of the popup.

## WebComponent Tag

`N/A`

## Block Name

`Config Popup` or `Config-popup`.

The names are case insensitive.

## Block Options

| Option | Value | Default | Description |
|-|-|-|-|
| `type` | `modal` or `flyout` | `modal` | Sets the visual style of the popup. |
| `size` | `1` to `12` | `10` | Sets the width of the popup based on a 12 columns grid. |
| `offset` | `1` to `12` | `2` | Changes the horizontal alignment of the popup based on a 12 columns grid. |
| `height `| `px` or `vh` | `80vh` | Set the maximum height of the popup. The unit is required with the number.

### Special use case

The [popup](./popup.md) component searches in the content of the popup source page for any element with a css class of `.config-popup` and gets the options.
