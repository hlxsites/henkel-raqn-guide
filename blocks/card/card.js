import ComponentBase from '../../scripts/component-base.js';
import { eagerImage } from '../../scripts/libs.js';

export default class Card extends ComponentBase {
  static observedAttributes = ['columns', 'ratio', 'eager', 'background', 'button'];

  ready() {
    this.eager = parseInt(this.getAttribute('eager') || 0, 10);
    this.classList.add('inner');
    if (this.eager) {
      eagerImage(this, this.eager);
    }
  }

  convertLink(a) {
    const button = document.createElement('raqn-button');
    const content = a.outerHTML;
    button.innerHTML = content;
    a.replaceWith(button);
  }

  setupRatio(ratio) {
    this.ratio = ratio || '4/3';
    this.style.setProperty('--card-ratio', this.ratio);
  }

  setupColumns(columns) {
    if (!columns) return;

    this.columns = parseInt(columns, 10);
    this.area = Array.from(Array(parseInt(this.columns, 10)))
      .map(() => '1fr')
      .join(' ');
    this.style.setProperty('--card-columns', this.area);
  }

  onAttributeColumnsChanged({ oldValue, newValue }) {
    if (oldValue === newValue) return;
    this.setupColumns(newValue);
  }

  onAttributeRatioChanged({ oldValue, newValue }) {
    if (oldValue === newValue) return;
    this.setupRatio(newValue);
  }
}
