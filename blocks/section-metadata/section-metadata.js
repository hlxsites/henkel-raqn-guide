import { collectAttributes } from '../../scripts/libs.js';
import ComponentBase from '../../scripts/component-base.js';

// TODO the block for this component should not have content, the values should come only form class attribute as for any other component
// as for any other block. should replace the this.parentElement
export default class SectionMetadata extends ComponentBase {
  async ready() {
    const classes = [...this.querySelectorAll(':scope > div > div:first-child')].map(
      (keyCell) => `${keyCell.textContent.trim()}-${keyCell.nextElementSibling.textContent.trim()}`,
    );

    const { currentAttributes } = collectAttributes(
      'section-metadata',
      classes,
      SectionMetadata.observedAttributes,
      this,
    );
    const section = this.parentElement;
    Object.keys(currentAttributes).forEach((key) => {
      if (key === 'class') {
        section.setAttribute(key, currentAttributes[key]);
      } else {
        section.setAttribute(`data-${key}`, currentAttributes[key]);
      }
    });
  }
}
