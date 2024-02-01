import { start, startBlock } from './init.js';

export default class ComponentBase extends HTMLElement {
  static get knownAttributes() {
    return [
      ...(Object.getPrototypeOf(this).knownAttributes || []),
      ...(this.observedAttributes || [])
    ]
  }

  constructor() {
    super();
    this.fragment = false;
    this.dependencies = [];
    this.uuid = `gen${crypto.randomUUID().split('-')[0]}`;
  }

  async connectedCallback() {
    const initialized = this.getAttribute('initialized');
    if (!initialized) {
      this.setAttribute('id', this.uuid);
      if (this.fragment) {
        await this.loadFragment(this.fragment);
      }
      if (this.dependencies.length > 0) {
        await Promise.all(this.dependencies.map((dep) => start({ name: dep })));
      }
      this.connected();
      this.ready();
      this.setAttribute('initialized', true);
      this.dispatchEvent(new CustomEvent('initialized', { detail: { block: this } }));
    }
  }

  async loadFragment(path) {
    const response = await fetch(
      `${path}`,
      window.location.pathname.endsWith(path) ? { cache: 'reload' } : {},
    );
    return this.processFragment(response);
  }

  async processFragment(response) {
    if (response.ok) {
      const html = await response.text();
      this.innerHTML = html;
      return this.querySelectorAll(':scope > div > div').forEach((block) => startBlock(block));
    }
    return response;
  }

  connected() {}

  ready() {}
}
