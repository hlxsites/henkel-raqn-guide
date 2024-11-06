import ComponentBase from '../../scripts/component-base.js';

const prefixPath = '/api-definitions';

export default class SwaggerUI extends ComponentBase {

  switchAPI(hash) {
    const currentEnvironment = hash.length > 0 ? hash.substring(1).replace(/--.+$/, '') : false;
    this.querySelectorAll('.swagger-ui-selection > ul > li').forEach((item) => {
      if(item.dataset.environment === currentEnvironment) {
        item.classList.remove('closed');
      } else {
        item.classList.add('closed');
      }
    });
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

  navigationClick(e, hash) {
    e.preventDefault();
    if(!window.location.hash.startsWith(hash)) {
      window.location.hash = hash;
      this.switchAPI(hash);
    }
  }

  async generateAPISelection(selectionElement) {
    const response = await fetch(`${prefixPath}/environments.json`);
    const environments = await response.json();
    const environmentElements = await Promise.all(environments.map(async (environment) => {
      const item = document.createElement('li');
      item.dataset.environment = environment.folder;
      const anchor = document.createElement('a');
      const url = new URL(window.location.href);
      url.hash = environment.folder;
      anchor.addEventListener('click', (e) => this.navigationClick(e, url.hash));
      anchor.href = url.toString();
      anchor.textContent = environment.label;
      item.appendChild(anchor);
      const filter = document.createElement('input');
      filter.placeholder = 'Search';
      item.appendChild(filter);
      const apiResponse = await fetch(`${prefixPath}/${environment.folder}/index.json`);
      const apis = await apiResponse.json();
      const definitionsElement = document.createElement('ul');
      apis.sort((a, b) => a.label.localeCompare(b.label)).forEach((api) => {
        const apiItem = document.createElement('li');
        const apiAnchor = document.createElement('a');
        const apiUrl = new URL(window.location.href);
        apiUrl.hash = `${environment.folder}--${api.id}`;
        apiAnchor.addEventListener('click', (e) => this.navigationClick(e, apiUrl.hash));
        apiAnchor.href = apiUrl.toString();
        apiAnchor.textContent = `${api.label}${api.version ? ` (${api.version})` : ''}`;
        apiItem.appendChild(apiAnchor);
        definitionsElement.appendChild(apiItem);
      });
      item.appendChild(definitionsElement);
      filter.addEventListener('input', () => {
        definitionsElement.querySelectorAll('li').forEach((apiItem) => {
          if (apiItem.textContent.toLowerCase().includes(filter.value.toLowerCase())) {
            apiItem.style.display = 'block';
          } else {
            apiItem.style.display = 'none';
          }
        });
      });
      return item;
    }));
    const environmentsElement = selectionElement.querySelector(':scope > ul');
    environmentElements.forEach((option) => environmentsElement.appendChild(option));
  }

  async loadAPIs(apiFilter) {
    const selectionElement = this.querySelector('.swagger-ui-selection');
    if(apiFilter.length === 0) {
      await this.generateAPISelection(selectionElement);
    }

    const hashes = apiFilter.length > 0 ? apiFilter : [window.location.hash];
    hashes.forEach((hash) => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('swagger-ui-wrapper');
      this.insertBefore(wrapper, selectionElement.nextSibling);
      this.switchAPI(hash);
    });
    
    this.switchAPI(apiFilter.length > 0 ? apiFilter[0] : window.location.hash);
  }

  async init() {
    super.init();
    const apiFilter = [...this.querySelectorAll('a')]
      .map((a) => new URL(a.href).hash)
      .filter((hash) => hash.length > 0 && hash.indexOf('--') > 0);

    this.innerHTML = `
      <div class="swagger-ui-selection">
        <ul></ul>
      </div>`;
    
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
