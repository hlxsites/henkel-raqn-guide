import ComponentBase from '../../scripts/component-base.js';
import { eagerImage, getMeta } from '../../scripts/libs.js';

const metaHeader = getMeta('header');
const metaFragment = !!metaHeader && `${metaHeader}.plain.html`;
export default class Header extends ComponentBase {
  fragment = metaFragment || 'header.plain.html';

  dependencies = ['navigation'];

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        addToTargetMethod: 'append',
      },
    ];
  }

  static earlyStopRender() {
    return metaFragment === false;
  }

  connected() {
    eagerImage(this, 1);
  }
}
