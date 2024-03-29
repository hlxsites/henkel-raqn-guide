import ComponentBase from '../../scripts/component-base.js';

export default class Hero extends ComponentBase {
  static observedAttributes = ['order'];

  ready() {
    const child = this.children[0];
    child.replaceWith(...child.children);
    this.classList.add('full-width');
    this.setAttribute('role', 'banner');
    this.setAttribute('aria-label', 'hero');
  }

  onAttributeOrderChanged({ newValue }) {
    this.style.setProperty('--hero-hero-order', newValue);
  }
}
