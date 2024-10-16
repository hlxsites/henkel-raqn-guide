import ComponentBase from '../../scripts/component-base.js';

const prefixPath = '/api-definitions';

export default class SwaggerUI extends ComponentBase {

  async loadEnvironments() {
    const response = await fetch(`${prefixPath}/environments.json`);
    return response.json();
  }

  async loadAPIs() {
    const environmentsElement = this.querySelector('.swagger-ui-selection .environments');
    const definitionsElement = this.querySelector('.swagger-ui-selection .definitions');
    const wrapperElement = this.querySelector('.swagger-ui-wrapper');

    const environments = await this.loadEnvironments();
    environments.forEach((environment) => {
      const option = document.createElement('option');
      option.value = environment;
      option.textContent = environment;
      environmentsElement.appendChild(option);
    });

    environmentsElement.addEventListener('change', async () => {
      const response = await fetch(`${prefixPath}/${environmentsElement.value}/index.json`);
      const apis = await response.json();
      definitionsElement.innerHTML = '';
      wrapperElement.innerHTML = '';
      apis.forEach((api) => {
        const option = document.createElement('option');
        option.value = api;
        option.textContent = api;
        definitionsElement.appendChild(option);
      });
      definitionsElement.addEventListener('change', () => {
        const file = definitionsElement.value;
        wrapperElement.innerHTML = '';
        window.SwaggerUIBundle({
          url: `${prefixPath}/${environmentsElement.value}/${file}`,
          domNode: wrapperElement,
          presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIStandalonePreset],
          layout: 'StandaloneLayout',
        });
      });
      definitionsElement.dispatchEvent(new Event('change'));
    });
    environmentsElement.dispatchEvent(new Event('change'));
  }

  async ready() {
    this.innerHTML = `
      <div class="swagger-ui-selection">
        <select class="environments"></select>
        <select class="definitions"></select>
      </div>
      <div class="swagger-ui-wrapper"></div>`;
    
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
    
    await this.loadAPIs();
  }

}
