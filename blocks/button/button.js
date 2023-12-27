import ComponentBase from '../../scripts/component-base.js';

export default class Button extends ComponentBase {
  connected() {
    this.setAttribute('role', 'button');
    this.setAttribute('tabindex', '0');
  }
}
