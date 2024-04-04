import { collectAttributes } from '../../scripts/libs.js';
import ComponentBase from '../../scripts/component-base.js';
import ComponentMixin from '../../scripts/component-mixin.js';

export default class SectionMetadata extends ComponentBase {
  async ready() {
    const classes = [...this.querySelectorAll(':scope > div > div:first-child')]
      .map((keyCell) => `${keyCell.textContent.trim()}-${keyCell.nextElementSibling.textContent.trim()}`);
    
    const { currentAttributes } = collectAttributes('section-metadata', classes, await ComponentMixin.getMixins(), this.knownAttributes, this);
    const section = this.parentElement;
    Object.keys(currentAttributes).forEach((key) => {
      if(key === 'class') {
        section.setAttribute(key, currentAttributes[key]);
      } else {
        section.setAttribute(`data-${key}`, currentAttributes[key]);
      }
    });
    await ComponentMixin.startAll(section);
  }
}
