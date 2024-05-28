import ComponentBase from '../../scripts/component-base.js';
import { stringToArray } from '../../scripts/libs.js';

export default class SectionMetadata extends ComponentBase {
  static observedAttributes = ['class'];

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        classes: {
          section: 'section',
        },
      },
    ];
  }

  ready() {
    this.parentElement.classList.add(this.config.classes.section, ...this.classList.values());
  }

  onAttributeClassChanged({ oldValue, newValue }) {
    if (!this.initialized) return;
    if (oldValue === newValue) return;

    const opts = { divider: ' ' };
    this.parentElement.classList.remove(...stringToArray(oldValue, opts));
    this.parentElement.classList.add(...stringToArray(newValue, opts));
  }
}
