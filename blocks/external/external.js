import ComponentBase from '../../scripts/component-base.js';

export default class External extends ComponentBase {
  static get observedAttributes() {
    return ['external', 'folder'];
  }

  link = false;

  get external() {
    const link = this.querySelector('a');
    if (link) {
      this.link = link.href;
    }
    return this.link;
  }

  set external(value) {
    if (value !== '') {
      this.link = value;
    }
  }
}
