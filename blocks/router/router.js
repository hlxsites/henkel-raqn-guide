import ComponentBase from '../../scripts/component-base.js';

export default class Router extends ComponentBase {
  static observedAttributes = ['data-external'];

  getPlainUrl(url) {
    if (url.indexOf('.html') >= 0) {
      return url.replace(/\.html$/, '.plain.html');
    }
    if (url.endsWith(`${window.location.host}/`) || url === '') {
      return '/index.plain.html';
    }
    return `${url}.plain.html`;
  }

  init() {
    super.init();
    document.addEventListener(
      'click',
      (event) => {
        if (event.target.tagName === 'A' && event.target.href.startsWith(window.location.origin)) {
          event.preventDefault();
          this.setAttribute('external', event.target.href);
        }
      },
      true,
    );
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'external' && oldValue !== newValue) {
      this.external = newValue;
      window.history.pushState(this.external, '', this.external);
      this.load(this.getPlainUrl(this.external));
    }
  }

  async processFragment(response) {
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
