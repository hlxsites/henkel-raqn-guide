import ComponentBase from '../../scripts/component-base.js';
import { eagerImage } from '../../scripts/init.js';

export default class Header extends ComponentBase {
  external = '/header.plain.html';

  async processExternal(response) {
    await super.processExternal(response);
    eagerImage(this, 1);
  }
}
