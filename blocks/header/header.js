import ComponentBase from '../../scripts/component-base.js';
import { eagerImage, getMeta } from '../../scripts/libs.js';

export default class Header extends ComponentBase {
  fragment = `${getMeta('basepath')}/header.plain.html`;

  dependencies = ['navigation'];

  async processFragment(response) {
    await super.processFragment(response);
    eagerImage(this, 1);
  }
}
