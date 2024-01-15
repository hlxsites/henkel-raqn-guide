# Everything as Client-Side JavaScript

As mentioned and for what is rendered at the server-side.

Things that can be done without JavaScript:

1. Style basic HTML set on the page.
2. Predefine sizes on LCP (although even the header is not available SSR).
3. Set the scripts to and things to preload.

Most features depend on JavaScript to transform the DOM and hydrate it.

1. Load and prioritize resources that are not in head.html.
2. Initially hide the body.
3. Parse DOM.
4. Compile rendering blocking styles and JavaScript.
5. Load header.plain.html.
6. Load other non-eager components.

The only server-side injection available is by head.html.

## Requirements

- Client-side Hydration DOM transformation "decoration."
- Manual focus on FCP and LCP.
- Queue and block each resource before loading and rendering next.

## Boilerplate Approach

1. Performance by avoiding visible rendering before loading required.
2. Decoration by feature.
3. Manually defining priority of required.
4. Eager and deferred.
5. Semantical content used as component functional content (metadata) among others.

## Defining Blocks and Features

### Default Script Behavior - Non-block Features

1. Setup SampleRun.
2. Eager loading
   1. decorateTemplateAndTheme (Required once, add classes to body).
   2. Load external header, add CSS variables using metadata (required to avoid CLS and must be defined used styles.css).
   3. decorateMain (Required once, but need to run always that a new DOM is loaded or added) includes:
      1. decorate buttons, icons, blocks, Section, Images, grid.
   4. If desktop loads fonts.
3. Lazy and delayed
4. Load blocks (by order of appearance)
5. Load footer and decorate it manually
6. Load fonts
7. Load lazy styles
8. Observe for delayed, etc.

### Block Features

An example of a block

```javascript
export default async function decorate(block) {
  // add feature to a element (block)
  // Eg add events transform it etc.
}
```

Here are some examples:
[Example HEADER](https://github.com/adobe/aem-boilerplate/blob/main/blocks/header/header.js)

## Advantages:

1. Simple
2. Functional approach good for testing
3. JavaScript modules
4. Enforce LCP
5. Performance monitoring using RUM

## Disadvantages:

1. Blocks need to be executed manually in every element
2. Any new DOM needs to be decorated manually
3. Limited reusability of a "component"
4. Too opinionated allows free-style coding / no code best practices enforcing
5. No clear life cycle of a block
6. Uses semantical data as parameters and passing options