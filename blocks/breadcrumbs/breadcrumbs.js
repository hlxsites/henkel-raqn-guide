import ComponentBase from '../../scripts/component-base.js';
import { getBaseUrl } from '../../scripts/libs.js';

export default class Breadcrumbs extends ComponentBase {
  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    targetsSelectors: 'main > div',
    targetsSelectorsLimit: 1,
  };

  nestedComponentsConfig = {};

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        contentFromTargets: false,
        addToTargetMethod: 'replaceWith',
        targetsAsContainers: {
          addToTargetMethod: 'prepend',
        },
      },
    ];
  }

  connected() {
    this.classList.add('full-width');
    this.classList.add('breadcrumbs');
    this.path = window.location.href.split(getBaseUrl()).join('/').split('/');
    this.innerHTML = `
    <ul>
        ${this.path
          .map((path, index) => {
            if (path === '') {
              return `<li><a href="/${path}">Home</a></li>`;
            }
            if (index === this.path.length - 1) {
              return `<li>${this.capitalize(path)}</li>`;
            }
            const href = this.path.slice(0, index + 1).join('/');
            return `<li><a href="${href}">${this.capitalize(path)}</a></li>`;
          })
          .join('<li class="separator">›</li>')}
    </ul>`;
  }

  capitalize(string) {
    return string
      .split('-')
      .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
      .join(' ');
  }
}
