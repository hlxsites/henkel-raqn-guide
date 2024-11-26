import ComponentBase from '../../scripts/component-base.js';
import { eagerImage, getMeta, metaTags } from '../../scripts/libs.js';

const metaHeader = getMeta(metaTags.header.metaName);

export default class Header extends ComponentBase {
  attributesValues = {
    all: {
      class: ['color-primary'],
    },
  };

  fragmentPath = `${metaHeader}.plain.html`;

  async init() {
    super.init();
    eagerImage(this, 1);
  }
}
