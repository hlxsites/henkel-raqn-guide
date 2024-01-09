import ComponentBase from '../../scripts/component-base.js';
import { eagerImage } from '../../scripts/libs.js';

export default class Card extends ComponentBase {
  static get observedAttributes() {
    return ['columns', 'ratio', 'eager', 'background', 'button'];
  }

  connected() {
    if (this.getAttribute('button') === 'true') {
      Array.from(this.querySelectorAll('a')).forEach((a) =>
        this.convertLink(a),
      );
    }
    this.eager = parseInt(this.getAttribute('eager') || 0, 10);
    this.ratio = this.getAttribute('ratio') || '4/3';
    this.style.setProperty('--card-ratio', this.ratio);
    this.classList.add('inner');
    this.setupColumns(this.getAttribute('columns'));
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
}
