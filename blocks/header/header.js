import ComponentBase from '../../scripts/component-base.js';
import { loadBlocks } from '../../scripts/lib-franklin.js';
import { decorateMain } from '../../scripts/scripts.js';

class Header extends ComponentBase {
  get external() {
    return '/header.plain.html';
  }

  async processExternal(response) {
    console.log('header', response);
    await super.processExternal(response);
    decorateMain(this.block);
    loadBlocks(this.block);
  }
}

export default async function (block) {
  console.log('hader', block);
  return new Header(block);
}
