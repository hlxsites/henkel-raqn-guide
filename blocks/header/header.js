import ComponentBase from '../../scripts/component-base.js';
import { eagerImage } from '../../scripts/libs.js';

export default class Header extends ComponentBase {
  external = '/header.plain.html';

  dependencies = ['navigation'];

  async processExternal(response) {
    await super.processExternal(response);
    eagerImage(this, 1);
  }
}
