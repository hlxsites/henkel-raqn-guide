import ComponentBase from '../../scripts/component-base.js';

export default class Hero extends ComponentBase {
  get observedAttributes() {
    return ['order'];
  }

  connected() {
    const child = this.children[0];
    child.replaceWith(...child.children);
    this.classList.add('full-width');
    this.setAttribute('role', 'banner');
    this.setAttribute('aria-label', 'hero');
    this.style.setProperty('--hero-hero-order', this.getAttribute('order'));
  }
}
