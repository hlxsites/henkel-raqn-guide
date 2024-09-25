import ComponentBase from '../../scripts/component-base.js';

export default class SwaggerUI extends ComponentBase {

  async ready() {
    const loadCSS = async (href) => new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.append(link);
    });
    loadCSS('/blocks/swagger-ui/libs/swagger-ui.css');
    const loadJS = async (src) => new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    await loadJS('/blocks/swagger-ui/libs/swagger-ui-bundle.js');
    await loadJS('/blocks/swagger-ui/libs/swagger-ui-standalone-preset.js');
    window.SwaggerUIBundle({
      url: '/apis/taxonomy-api-v1.yaml',
      domNode: this,
      presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout',
    });
  }

}
