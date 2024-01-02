import ComponentBase from '../../scripts/component-base.js';
import { eagerImage } from '../../scripts/libs.js';

export default class Header extends ComponentBase {
  external = '/header.plain.html';

  async processExternal(response) {
    await super.processExternal(response);
    this.parentElement.style.display = 'flex';
    eagerImage(this, 1);
  }
}
