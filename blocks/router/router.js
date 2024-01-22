import ComponentBase from '../../scripts/component-base.js';

export default class Router extends ComponentBase {
  static get observedAttributes() {
    return ['external'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'external' && oldValue !== newValue) {
      this.external = newValue;
      this.load(this.external);
    }
  }

  async processExternal(response) {
    if (response.ok) {
      const html = await response.text();
      const main = document.body.querySelector('main');
      if (main) {
        document.body.querySelector('main').innerHTML = html;
      }
      return this.refresh(main);
    }
    return response;
  }
}
