import ComponentBase from '../../scripts/component-base.js';
import { eagerImage, getMeta, metaTags } from '../../scripts/libs.js';

const metaHeader = getMeta(metaTags.header.metaName);

export default class Header extends ComponentBase {
  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    targetsSelectors: ':scope > header',
    targetsSelectorsLimit: 1,
    loaderStopInit() {
      return metaHeader === false;
    },
  };

  attributesValues = {
    all: {
      class: 'color-primary',
    },
  };

  fragmentPath = `${metaHeader}.plain.html`;

  dependencies = ['navigation', 'image'];

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        contentFromTargets: false,
        addToTargetMethod: 'append',
        targetsAsContainers: {
          addToTargetMethod: 'append',
          contentFromTargets: false,
        },
      },
    ];
  }

  ready() {
    eagerImage(this, 1);
  }
}
