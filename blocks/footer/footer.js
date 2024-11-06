import ComponentBase from '../../scripts/component-base.js';
import { getMeta, metaTags } from '../../scripts/libs.js';

const metaFooter = getMeta(metaTags.footer.metaName);

export default class Footer extends ComponentBase {
  fragmentPath = `${metaFooter}.plain.html`;

  init() {
    super.init();
    this.elements.nav = this.querySelector('ul');
    this.elements.nav?.setAttribute('role', 'navigation');
  }
}
