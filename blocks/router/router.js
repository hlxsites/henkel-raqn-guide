import ComponentBase from '../../scripts/component-base.js';

export default class Router extends ComponentBase {
  static get observedAttributes() {
    return ['external'];
  }

  getPlainUrl(url) {
    if (url.indexOf('.html') >= 0) {
      return url.replace(/\.html$/, '.plain.html');
    }
    return `${url}.plain.html`;
  }

  ready() {
    document.addEventListener(
      'click',
      (event) => {
        if (
          event.target.tagName === 'A' &&
          event.target.href.startsWith(window.location.origin)
        ) {
          event.preventDefault();
          this.setAttribute('external', this.getPlainUrl(event.target.href));
        }
      },
      true,
    );
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'external' && oldValue !== newValue) {
      this.external = newValue;
      console.log(this.external, this.getPlainUrl(this.external));
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
