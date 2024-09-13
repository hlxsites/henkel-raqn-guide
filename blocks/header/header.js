import ComponentBase from '../../scripts/component-base.js';
import { eagerImage, getMeta, metaTags } from '../../scripts/libs.js';

const metaHeader = getMeta(metaTags.header.metaName, { getFallback: true });

export default class Header extends ComponentBase {
  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    loaderStopInit() {
      return metaHeader === false;
    },
  };

  attributesValues = {
    all: {
      class: {
        color: 'primary',
      },
    },
  };

  fragmentPath = `${metaHeader}.plain.html`;

  dependencies = ['navigation', 'image'];

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        addToTargetMethod: 'append',
      },
    ];
  }

  connected() {
    eagerImage(this, 1);
  }
}
