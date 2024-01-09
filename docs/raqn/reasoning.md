# Reasoning

We want to take advantage of Edge Delivery cababilities but improving some key features we embrace in RAQN web

1. Components Based Development
2. Authoring theming capabilityes
3. Fine Grained Perfomance by authoring

For proof of concept we are recreating https://guide.raqn.io/ in EDS

## Component Based Development

We want to be able to add features as reusable components instead of a composition of functions.

That allows us to:
1 - Have a clear component life cicle
2 - Enforce good code practices
3 - Easy Reusability

## Authoring Theme Capabilityes

We want authors to be able to create fast and quick simple websites without having a development team available

this means same code can:

1. Change colors
2. Change composition (grid, margins, borders)
3. Change Icons
4. Change fonts
5. Apply specific styles

## Fine Grained Perfomance

As the same concept of themeing we want to be able to setup same code base with diferent params related to perfomance.

not all websites have the same set of components order / layout definitions therefore we need to be able to change components and elements priorization _without development_ to be able to still get 100% perfomance.

Those are the minimal requirements
1 - Allow to setup what components are LCP
2 - Allow to setup what images are eager loaded
