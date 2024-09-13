import ComponentBase from '../../scripts/component-base.js';
import { getMeta, metaTags } from '../../scripts/libs.js';

export default class Breadcrumbs extends ComponentBase {
  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    targetsSelectors: 'main > div:first-child',
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
          contentFromTargets: false,
        },
      },
    ];
  }

  connected() {
    this.classList.add('full-width');
    this.classList.add('breadcrumbs');
    const { origin, pathname } = window.location;
    let breadcrumbRoot = getMeta(metaTags.breadcrumbRoot.metaName, { getFallback: true });
    breadcrumbRoot = breadcrumbRoot?.startsWith('/') ? breadcrumbRoot : `/${breadcrumbRoot}`;

    this.pathPages = `${origin}${pathname}`.split(`${origin}${breadcrumbRoot}`).join('/').split('/');
    this.innerHTML = `
    <ul>
        ${this.pathPages
          .map((pageName, index) => {
            if (pageName === '') {
              return `<li><a href="/${pageName}">Home</a></li>`;
            }
            if (index === this.pathPages.length - 1) {
              return `<li>${this.capitalize(pageName)}</li>`;
            }
            const href = this.pathPages.slice(0, index + 1).join('/');
            return `<li><a href="${href}">${this.capitalize(pageName)}</a></li>`;
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
