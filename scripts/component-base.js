import { loadBlocks } from './lib-franklin.js';
import { decorateMain } from './scripts.js';

export default class ComponentBase {
  static get breakpoints() {
    return {
      S: 0,
      M: 768,
      L: 1024,
      XL: 1280,
      XXL: 1920,
    };
  }

  constructor(block) {
    this.block = block;
    this.uuid = `gen${crypto.randomUUID().split('-')[0]}`;
    console.log('contructor', this);
    this.connectedCallback();
  }

  async connectedCallback() {
    console.log('connectedCallback', this);
    this.block.setAttribute('id', this.uuid);
    if (this.external) {
      await this.load(this.external);
    }
    this.connected();
    this.render();
  }

  async load(block) {
    const response = await fetch(
      `${block}`,
      window.location.pathname.endsWith(block) ? { cache: 'reload' } : {},
    );
    return this.processExternal(response);
  }

  async processExternal(response) {
    if (response.ok) {
      const html = await response.text();
      this.block.innerHTML = html;
      console.log('html', html);
    }
    return response;
  }

  connected() {}

  render() {}
}
