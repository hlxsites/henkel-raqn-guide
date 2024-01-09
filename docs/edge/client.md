# Everything as client side javascript

As mentioned and for what is rendered at serverside.

Things that can be done without javascript:

1. Style basic html set on the page.
2. Predefine sizes on LCP (althout even the header is not available SSR)
3. Set the scripts to and things to preload

Most features depends on javascript to transform dom and hidratate it.

1. load and priorize resorces that are not in head.html
2. inicially hide body
3. parse dom
4. compile rendering blocking styles and javascripts
5. Load header.plain.html
6. load other non eager components

The only server side injection available is by head.html.

Requirements

- Clientside Hidratation dom transformation "decoration"
- Manual focus on FCP and LCP
- queue and blocking each resources before loading and render next

Boiler plate approach

1. Performance by avoiding visible rendering before loading required
2. Decoration by feature
3. Manualy defining priority of required
4. Eager and defered
5. Semantical content used as component functional content (metadata) among others

## Defining blocks and features

### Default script behavior - Non block features

1. Setup SampleRun
2. Eager loading
   1. decorateTemplateAndTheme (Required once, add classes to body)
   2. Load external header, add css variables using metadata (required to avoid CLS and must be defined used styles.css)
   3. decorateMain (Required once, but need to run always that a new dom is loaded or added) includes:
      1. decorate buttons, icons, blocks, Section, Images, grid.
   4. if desktop loads fonts
3. Lazy and delayed 4. Load blocks (by order of apearance) 5. Load footer and decorate it manually 6. Load fonts 7. Load lazy styles 8. Observe for delayed etcs

### Block features

A example of a block

```javascript
export default async function decorate(block) {
  // add feature to a element (block)
  // Eg add events transform it etcs
}
```

Here is some examples:
(Example HEADER)[https://github.com/adobe/aem-boilerplate/blob/main/blocks/header/header.js]

Advances:
1 - Simple to add events etcs
2 - Functional approch good for testing
3 - usign modules allow importing from other libraries

Disavantages
1 - Blocks need to be executed manually in every element
2 - Any new dom needs be decorated manually
3 - Limited reusability of a "component"
4 - Too opniated, easy allows bad code
5 - no clear life cicle of a block
