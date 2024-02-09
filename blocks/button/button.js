import ComponentBase from '../../scripts/component-base.js';

export default class Button extends ComponentBase {
  ready() {
    this.setAttribute('role', 'button');
    this.setAttribute('tabindex', '0');
  }
}
