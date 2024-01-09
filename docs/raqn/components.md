# Component Base

We want to be able to add features as reusable components instead of a composition of functions.

That allows us to:

1. Have a clear component life cicle
2. Enforce good code practices
3. Easy Reusability

## Simple component loader

Instead of several decoration functions we setup a simple component loader to "decorate and prepare"

It allows:

1. Still keep the "blocks" as functional scripts
2. Allow to use custom elements intead
3. Proper setup data and params from class intead of semantical content data.
4. Params can be setup per breakpoint

## Component loader

Component setup params and custom elements

Let's check a example

Document example
![Hero](assets/hero-example.png)

That will:

1. Try to load a hero component or block
2. Will check if the loaded default has a name and not fn named decorate
3. If not it will create a custom element based on the name of the component
4. if is a decorate function keep as EDS

## Base Custom Element Component

A standard use custom elements as our definition of a component

That will

1. Extends HTMLElement
2. Pre define some extra life cicle
   1. predefine `connectedCallback`
   2. Load a external content if `external` property exist
   3. Run Component loader on it's content if external
   4. Add a life cicle for process external html as `processExternal`
   5. Add a `connected` after previous setup and externals are loaded
   6. Add a ready life cicle to setup things everythings is ready.
3. Keep all other custom element features

(component-base)[assets/component-base.js]

## Custom element

Let's first

With component loader that will be rendered as:

```html
<raqn-hero id="gen629e56de">
  <div>
    <picture>
      <!-- ..... -->
    </picture>
  </div>
  <div>
    <h2 id="get-started-1">Get started</h2>
    <p>
      Learn the basics: how to best get started and create a page. And how to
      transfer your brand theme to the new capabilities of RAQN web.
    </p>
  </div>
</raqn-hero>
```
