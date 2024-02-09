import { collectParams } from '../../scripts/libs.js';
import ComponentBase from '../../scripts/component-base.js';
import ComponentMixin from '../../scripts/component-mixin.js';

export default class SectionMetadata extends ComponentBase {
  async ready() {
    const classes = [...this.querySelectorAll(':scope > div > div:first-child')]
      .map((keyCell) => `${keyCell.textContent.trim()}-${keyCell.nextElementSibling.textContent.trim()}`);
    
    const params = collectParams('section-metadata', classes, await ComponentMixin.getMixins(), this.knownAttributes);
    const section = this.parentElement;
    Object.keys(params).forEach((key) => {
      if(key === 'class') {
        section.setAttribute(key, params[key]);
      } else {
        section.setAttribute(`data-${key}`, params[key]);
      }
    });
    await ComponentMixin.startAll(section);
  }
}
