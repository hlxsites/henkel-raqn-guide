import { init } from './init.js';

export default class ComponentBase extends HTMLElement {
  static get breakpoints() {
    return {
      S: 0,
      M: 768,
      L: 1024,
      XL: 1280,
      XXL: 1920,
    };
  }

  constructor() {
    super();
    this.external = false;
    this.uuid = `gen${crypto.randomUUID().split('-')[0]}`;
  }

  async connectedCallback() {
    this.setAttribute('id', this.uuid);
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
      this.innerHTML = html;
      return init(this);
    }
    return response;
  }

  connected() {}

  render() {}
}
