import ComponentBase from '../../scripts/component-base.js';
import { eagerImage } from '../../scripts/libs.js';

export default class Header extends ComponentBase {
  // keep as it is
  fragment = '/header.plain.html';

  dependencies = ['navigation'];

  async processFragment(response) {
    await super.processFragment(response);
    eagerImage(this, 1);
  }
}
