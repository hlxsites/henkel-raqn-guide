import ComponentBase from '../../scripts/component-base.js';
import { eagerImage, getMeta, metaTags } from '../../scripts/libs.js';

const { metaName, fallbackContent } = metaTags.header;
const metaHeader = getMeta(metaName);
const metaFragment = !!metaHeader && `${metaHeader}.plain.html`;
export default class Header extends ComponentBase {
  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    loaderStopInit() {
      return metaHeader === false;
    },
  };

  fragmentPath = metaFragment || `${fallbackContent}.plain.html`;

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
