import { init, start } from './init.js';

export default class ComponentBase extends HTMLElement {
  constructor() {
    super();
    this.external = false;
    this.dependencies = [];
    this.uuid = `gen${crypto.randomUUID().split('-')[0]}`;
  }

  async connectedCallback() {
    const initialized = this.getAttribute('initialized');
    if (!initialized) {
      this.setAttribute('id', this.uuid);
      if (this.external) {
        await this.load(this.external);
      }
      if (this.dependencies.length > 0) {
        await Promise.all(this.dependencies.map((dep) => start({ name: dep })));
      }
      this.connected();
      this.ready();
      this.setAttribute('initialized', true);
    }
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
      return this.refresh(this);
    }
    return response;
  }

  refresh(el = this) {
    init(el);
  }

  connected() {}

  ready() {}
}
