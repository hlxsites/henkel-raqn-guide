import ComponentBase from '../../scripts/component-base.js';
import { eagerImage, getMeta } from '../../scripts/libs.js';

const metaHeader = getMeta('header');
const headerClass = getMeta('headerClass') || 'color-primary';
const metaFragment = !!metaHeader && `${metaHeader}.plain.html`;
export default class Header extends ComponentBase {
  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    loaderStopInit() {
      return metaHeader === false;
    },
  };

  fragmentPath = metaFragment || 'header.plain.html';

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
