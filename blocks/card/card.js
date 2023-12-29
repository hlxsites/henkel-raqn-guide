import ComponentBase from '../../scripts/component-base.js';
import { eagerImage } from '../../scripts/libs.js';

export default class Card extends ComponentBase {
  static get observedAttributes() {
    return ['columns', 'ratio', 'eager'];
  }

  connected() {
    this.eager = parseInt(this.getAttribute('eager') || 0, 10);
    this.setupColumns(this.getAttribute('columns'));
    if (this.eager) {
      eagerImage(this, this.eager);
    }
  }

  setupColumns(columns) {
    if (!columns) {
      return;
    }
    this.columns = parseInt(columns, 10);
    this.area = Array.from(Array(parseInt(this.columns, 10)))
      .map(() => '1fr')
      .join(' ');
    this.style.setProperty('--card-columns', this.area);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case 'columns':
          this.setupColumns(newValue);
          break;
        case 'ratio':
          this.style.setProperty('--card-ratio', newValue);
          break;
        default:
          break;
      }
    }
  }
}
