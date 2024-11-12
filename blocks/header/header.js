import ComponentBase from '../../scripts/component-base.js';
import { eagerImage, getMeta, metaTags } from '../../scripts/libs.js';
import { componentList } from '../../scripts/component-list/component-list.js';

const metaHeader = getMeta(metaTags.header.metaName);

export default class Header extends ComponentBase {
  dependencies = componentList.header.module.dependencies;

  attributesValues = {
    all: {
      class: ['color-primary'],
    },
  };

  fragmentPath = `${metaHeader}.plain.html`;

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        addToTargetMethod: 'append',
      },
    ];
  }

  async init() {
    super.init();
    eagerImage(this, 1);
  }
}
