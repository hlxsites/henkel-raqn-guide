
import ComponentBase from '../../scripts/component-base.js';

export default class External extends ComponentBase {
  constructor() {
    super();
    this.classList.add('full-width');
    this.external = this.getAttribute('external');
  }
}
