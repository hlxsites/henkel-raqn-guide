import ComponentBase from '../../scripts/component-base.js';
import { getMeta, metaTags, capitalizeCase } from '../../scripts/libs.js';

export default class Breadcrumbs extends ComponentBase {
  attributesValues = {
    all: {
      class: ['full-width'],
    },
  };

  init() {
    super.init();
    const { origin, pathname } = window.location;
    let breadcrumbRoot = getMeta(metaTags.breadcrumbRoot.metaName);
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
      .map((str) => capitalizeCase(str))
      .join(' ');
  }
}
