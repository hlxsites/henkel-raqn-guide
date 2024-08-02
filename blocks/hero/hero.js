import ComponentBase from '../../scripts/component-base.js';

export default class Hero extends ComponentBase {
  static observedAttributes = ['data-order'];

  dependencies = ['icon', 'button', 'image'];

  // Default values for the attributes
  attributesValues = {
    all: {
      class: {
        full: 'width',
      },
      attribute: {
        role: 'banner',
        'aria-label': 'hero',
      },
    },
  };

  ready() {
    const child = this.querySelector(':has( div + div)');

    if (!child) return;
    child.replaceWith(...child.children);
  }

  onAttributeOrderChanged({ newValue }) {
    this.style.setProperty('--hero-hero-order', newValue);
  }
}
