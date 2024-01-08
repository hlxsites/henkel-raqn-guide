import ComponentBase from '../../scripts/component-base.js';
import { eagerImage } from '../../scripts/libs.js';

class Card extends ComponentBase {
  static get observedAttributes() {
    return ['columns', 'ratio', 'eager', 'background', 'button'];
  }

  connected() {
    if (this.block.getAttribute('button') === 'true') {
      Array.from(this.querySelectorAll('a')).forEach((a) =>
        this.convertLink(a),
      );
    }
    this.eager = parseInt(this.block.getAttribute('eager') || 0, 10);
    this.ratio = this.block.getAttribute('ratio') || '4/3';
    this.block.style.setProperty('--card-ratio', this.ratio);
    this.block.classList.add('inner');
    this.setupColumns(this.block.getAttribute('columns'));
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
    this.block.style.setProperty('--card-columns', this.area);
  }
}

export default async function card(block) {
  await new Card(block);
}
