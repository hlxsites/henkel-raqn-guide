import Grid from '../../blocks/grid/grid.js';
import ComponentBase from '../../scripts/component-base.js';
import component from '../../scripts/init.js';
import { globalConfig, metaTags, getMetaGroup, stringToArray, camelCaseAttr } from '../../scripts/libs.js';

export default class DynamicSidebar extends ComponentBase {
  static observedAttributes = [...Grid.observedAttributes];

  #templateColumns = ['template-sidebar-one', 'template-main', 'template-sidebar-two'];

  attributesValues = {
    all: {
      templateColumns: 'template-sidebar-one, template-main, template-sidebar-two',
    },
    l: {
      templateColumns: 'template-sidebar-one, template-main, template-sidebar-two',
    },
    m: {
      templateColumns: 'template-main, template-sidebar-one, template-sidebar-two',
    },
    grid: {
      all: {
        class: 'full-width',
        data: {
          columns: '300px 1fr',
        },
      },
      m: {
        columns: '1fr',
      },
      s: {
        columns: '1fr',
      },
      xs: {
        columns: '1fr',
      },
    },
    templateTwo: {},
    templateMain: {},
    templateOne: {},
  };

  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    targetsSelectors: ':scope > main',
  };

  nestedComponentsConfig = {};

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        innerComponents: `
          .template-sidebar-one ${globalConfig.blockSelector}, 
          .template-main > div, 
          .template-sidebar-two ${globalConfig.blockSelector}`,
        addToTargetMethod: 'append',
        targetsAsContainers: {
          addToTargetMethod: 'append',
        },
        structureComponents: '',
        structureAddToTargetMethod: 'append',
        structure: {
          breadcrumbs: {
            targetsSelectors: 'main',
          },
        },
      },
    ];
  }

  setDefaults() {
    super.setDefaults();
    this.category = 'template';
  }

  async onInit() {
    this.initLCP();
  }

  async addEDSHtml() {
    await this.createTemplateGrid();
  }

  async addHtml() {
    await this.initStructure();
  }

  ready() {
    this.initFooter();
  }

  initLCP() {
    component
      .multiInit([
        {
          componentName: 'theming',
          targets: [document.head],
          loaderConfig: {
            addToTargetMethod: 'append',
          },
        },
        {
          componentName: 'header',
          targets: [document.body],
          loaderConfig: {
            targetsSelectors: ':scope > header',
            targetsAsContainers: true,
          },
        },
      ])
      .then(() => {
        window.postMessage({ message: 'raqn:components:loaded' });
        document.body.style.setProperty('display', 'block');
      });
  }

  async createTemplateGrid() {
    await component.multiLoadAndDefine(['grid', 'grid-item']);
    const content = [...this.children];
    const contentByItem = content.reduce(
      (acc, item) => {
        const meta = item.querySelector(':scope > .section-metadata');
        if (!meta) {
          acc.templateMain.push(item);
          return acc;
        };

        const allowedCols = this.#templateColumns.find(
          (tc) => meta.classList.contains(tc) && (meta.classList.remove(tc) || true),
        );

        if (allowedCols) {
          acc[camelCaseAttr(allowedCols)].push(item);
        } else {
          acc.templateMain.push(item);
        }
        return acc;
      },
      { templateSidebarOne: [], templateSidebarTwo: [], templateMain: [] },
    );

    this.innerHTML = '';
    this.tplGrid = document.createElement('raqn-grid');
    this.tplGrid.attributesValues = this.attributesValues.grid;
    this.tplGrid.config.innerComponents = null;

    const itemsTpl = stringToArray(this.currentAttributesValues.templateColumns).filter((col) =>
      this.#templateColumns.includes(col),
    );
    const itemElemsItems = itemsTpl.map((item) => this.createGridItems(item));

    this.append(this.tplGrid);
    await this.tplGrid.initialization;

    this.tplGrid.append(...itemElemsItems);

    // To prevent errors initialization needs to be ready before appending content to new elements.
    await Promise.allSettled(Object.keys(contentByItem).map((c) => this[c]?.initialization));
    Object.keys(contentByItem).forEach((c) => this[c] && this[c].append(...contentByItem[c]));
  }

  createGridItems(item) {
    const camelCaseItem = camelCaseAttr(item);
    this[camelCaseItem] = document.createElement('raqn-grid-item');
    this[camelCaseItem].classList.add(item);
    this[camelCaseItem].attributesValues = this.attributesValues[camelCaseItem];
    this[camelCaseItem].config.innerComponents = null;

    return this[camelCaseItem];
  }

  applyTemplateColumns(val) {
    if (!this.initialized) return;
    const itemsTpl = stringToArray(val).filter((col) => this.#templateColumns.includes(col));
    const itemElemsItems = itemsTpl.map((itemTpl) =>
      [...this.tplGrid.children].find((item) => item.matches(`.${itemTpl}`)),
    );
    this.tplGrid.append(...itemElemsItems);
  }

  async initStructure() {
    let structureComponents = getMetaGroup(metaTags.structure.metaNamePrefix, { getFallback: false });
    const localStructure = stringToArray(this.config.structureComponents).flatMap((c) => {
      const name = c.trim();
      const structure = structureComponents.find((sc) => sc.name === name);
      if (structure) return structure;
      return { name, content: true };
    });
    structureComponents = structureComponents.filter((c) => !localStructure.some((lc) => c.name === lc.name));
    structureComponents = [...localStructure, ...structureComponents];

    this.structureComponents = structureComponents.flatMap(({ name, content }) => {
      if (content !== true) return [];
      const { structureAddToTargetMethod } = this.config;
      const { targetsSelectors, addToTargetMethod } = this.config.structure[name] || {};

      return {
        componentName: name.trim(),
        targets: [document],
        loaderConfig: {
          ...(targetsSelectors && { targetsSelectors }),
          targetsAsContainers: true,
        },
        componentConfig: {
          targetsAsContainers: {
            addToTargetMethod: addToTargetMethod || structureAddToTargetMethod,
          },
        },
      };
    });

    await component.multiInit(this.structureComponents);
  }

  initFooter() {
    return component.init({
      componentName: 'footer',
      targets: [document.body],
      loaderConfig: {
        targetsSelectors: ':scope > footer',
        targetsAsContainers: true,
      },
    });
  }
}
