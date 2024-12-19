import ComponentBase from '../../scripts/component-base.js';

export const prefixPath = '/api-definitions';
export const apiSwitchEvent = 'swaggerUI:apiSwitch';

export default class SwaggerUI extends ComponentBase {

  switchAPI(hash) {
    const currentEnvironment = hash.length > 0 ? hash.substring(1).replace(/--.+$/, '') : false;
    const currentAPI = currentEnvironment && (() => {
      const index = hash.indexOf('--');
      return index !== -1 ? hash.substring(index + 2) : false;
    })();
    
    const wrapperElement = this.querySelector('.swagger-ui-wrapper');
    wrapperElement.innerHTML = '';
    if(currentAPI) {
      window.SwaggerUIBundle({
        url: `${prefixPath}/${currentEnvironment}/${currentAPI}.yaml`,
        domNode: wrapperElement,
        presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
      });
    }
  }

  async loadAPIs(apiFilter) {
    const hashes = apiFilter.length > 0 ? apiFilter : [window.location.hash];
    hashes.forEach((hash) => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('swagger-ui-wrapper');
      this.append(wrapper);
      this.switchAPI(hash);
    });
    
    this.switchAPI(apiFilter.length > 0 ? apiFilter[0] : window.location.hash);
  }

  async init() {
    super.init();

    document.addEventListener(apiSwitchEvent, (e) => this.switchAPI(e.detail.hash));
    
    const apiFilter = [...this.querySelectorAll('a')]
      .map((a) => new URL(a.href).hash)
      .filter((hash) => hash.length > 0 && hash.indexOf('--') > 0);

    this.innerHTML = '';

    const loadCSS = async (href) => new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.append(link);
    });
    loadCSS('/blocks/swaggerui/libs/swagger-ui.css');
    const loadJS = async (src) => new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    await Promise.all([
      loadJS('/blocks/swaggerui/libs/swagger-ui-bundle.js'), 
      loadJS('/blocks/swaggerui/libs/swagger-ui-standalone-preset.js'),
    ]);
    
    await this.loadAPIs(apiFilter);
  }

}
