import ComponentBase from '../../scripts/component-base.js';
import { prefixPath, apiSwitchEvent } from '../swaggerui/swaggerui.js';

export default class SwaggerUINavigation extends ComponentBase {

  navigationClick(e, hash) {
    e?.preventDefault();
    this.querySelectorAll(':scope > ul[data-environment]').forEach((item) => {
      if(hash.startsWith(`#${item.dataset.environment}`)) {
        item.classList.remove('closed');
      } else if(!item.classList.contains('closed')) {
        item.classList.add('closed');
      }
    });
    if(!window.location.hash.startsWith(hash)) {
      window.location.hash = hash;
      document.dispatchEvent(new CustomEvent(apiSwitchEvent, { detail: { hash } }));
    }
  }

  async generateAPISelection() {
    const response = await fetch(`${prefixPath}/environments.json`);
    const environments = await response.json();
    const environmentOptions = await Promise.all(environments.map(async (environment) => {
      const item = document.createElement('option');
      item.textContent = environment.label;
      item.value = environment.folder;
      if(window.location.hash.startsWith(`#${environment.folder}`)) {
        item.selected = true;
      }

      const apiResponse = await fetch(`${prefixPath}/${environment.folder}/index.json`);
      const apis = await apiResponse.json();
      const definitionsElement = document.createElement('ul');
      definitionsElement.dataset.environment = environment.folder;
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
      this.appendChild(definitionsElement);
      return item;
    }));
    const environmentsSelect = this.querySelector(':scope > select[name="environment-selection"]');
    environmentOptions.forEach((option) => environmentsSelect.appendChild(option));

    environmentsSelect.addEventListener('change', (event) => this.navigationClick(event, `#${event.target.value}`));
    this.navigationClick(null, `#${environmentsSelect.selectedOptions[0].value}`);
  }

  async init() {
    super.init();

    this.innerHTML = `
      <label for="environment-selection">Environment:</label>
      <select name="environment-selection"></select>
      <label for="environment-filter">Filter:</label>
      <input name="environment-filter">
      `;
    
    await this.generateAPISelection();
    const filter = this.querySelector(':scope > input');
    const allApis = this.querySelectorAll(':scope > ul[data-environment] > li');
    filter.addEventListener('input', () => {
      allApis.forEach((apiItem) => {
        if (apiItem.textContent.toLowerCase().includes(filter.value.toLowerCase())) {
          apiItem.style.display = 'block';
        } else {
          apiItem.style.display = 'none';
        }
      });
    });

  }

}
