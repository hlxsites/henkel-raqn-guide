import ComponentBase from '../../scripts/component-base.js';
import { getMeta, metaTags } from '../../scripts/libs.js';

const { metaName, fallbackContent } = metaTags.footer;
const metaFooter = getMeta(metaName);
const metaFragment = !!metaFooter && `${metaFooter}.plain.html`;
export default class Footer extends ComponentBase {
  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    loaderStopInit() {
      return metaFooter === false;
    },
  };

  fragmentPath = metaFragment || `${fallbackContent}.plain.html`;

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        addToTargetMethod: 'append',
      },
    ];
  }

  ready() {
    const child = this.children[0];
    child.replaceWith(...child.children);
    this.nav = this.querySelector('ul');
    this.nav.setAttribute('role', 'navigation');
    this.classList.add('full-width');
    this.classList.add('horizontal');
  }
}
