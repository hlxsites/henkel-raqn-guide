import ComponentBase from '../../scripts/component-base.js';
import { eagerImage } from '../../scripts/libs.js';

export default class Header extends ComponentBase {
  external = '/header.plain.html';

  async processExternal(response) {
    await super.processExternal(response);
    console.log(this);
    eagerImage(this, 1);
  }
}
