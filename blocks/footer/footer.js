import ComponentBase from '../../scripts/component-base.js';
import { getMeta, metaTags } from '../../scripts/libs.js';

const metaFooter = getMeta(metaTags.footer.metaName);

export default class Footer extends ComponentBase {
  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    targetsSelectors: ':scope > footer',
    targetsSelectorsLimit: 1,
    loaderStopInit() {
      return metaFooter === false;
    },
  };

  fragmentPath = `${metaFooter}.plain.html`;

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
    this.nav = this.querySelector('ul');
    this.nav?.setAttribute('role', 'navigation');
  }
}
