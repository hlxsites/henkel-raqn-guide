import ComponentBase from '../../scripts/component-base.js';
import { eagerImage, getMeta, metaTags } from '../../scripts/libs.js';

const headerClass = getMeta('headerClass') || 'color-primary';
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
    this.classList.add(...headerClass.split('.'));
    eagerImage(this, 1);
  }
}
