# Button
## Description
A component used to style anchors as a button.

In specific cases it is used to transform anchors into buttons with specific actions by using nested components.
See [popup trigger](./../popup-trigger/popup-trigger.md) component.

## Block Name

`Button`

The name is case insensitive.

## Support as a Block

The component can be used as a block and in the body of the block an anchor needs to be added.

## Block Options

`n/a`

## WebComponent Tag
### `<raqn-button></raqn-button>`


## Initialization
### Initialization rule for generated EDS Blocks
The component will match any paragraph (`<p>`) or div (`<div>`) element which contains an anchor (`<a>`) with a valid `href` as the only child element.

## Editorial Initializations (in MS Word)
### 1. Button with text
1. The link needs to be added around the entire text in a table cell which will generate an anchor in a div.

2. The link needs to be added around all the text which was divided top and bottom from other text by using the Enter/Return key to create create paragraphs.
This will generate new paragraphs (`<p>`) for each block of text.

### 2. Button with text and icon

In addition to he above rules place the name of the icon using the special EDS notation (:iconname:) at the beginning or at the end of the anchor's text.

Example: 

[Read More :chevron-right:]()

[:chevron-right: Read More]()


### 3. Button with aria label and icon (no visible text)

To create linked icons without any visual text, it is required to have an aria label for accessibility .

The label part of the anchor text must be set as **bold**. This will remove the text from the anchor and add it as an aria-label.

Example: 

[**Read More** :chevron-right:]()



