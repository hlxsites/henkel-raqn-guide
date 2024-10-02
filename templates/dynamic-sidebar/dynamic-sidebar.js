import Grid from '../../blocks/grid/grid.js';
import ComponentBase from '../../scripts/component-base.js';
import component from '../../scripts/init.js';
import { globalConfig, metaTags, getMetaGroup } from '../../scripts/libs.js';

export default class Template extends ComponentBase {
  static observedAttributes = [...Grid.observedAttributes];

  attributesValues = {
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
        innerComponents: `.template-sidebar ${globalConfig.blockSelector}, .template-main > div`,
        addToTargetMethod: 'append',
        targetsAsContainers: {
          addToTargetMethod: 'append',
        },
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
    const content = [...this.childNodes];
    this.tplGrid = document.createElement('raqn-grid');
    this.tplSidebar = document.createElement('raqn-grid-item');
    this.tplMain = document.createElement('raqn-grid-item');
    this.tplSidebar.classList.add('template-sidebar');
    this.tplMain.classList.add('template-main');

    this.tplGrid.attributesValues = this.attributesValues.grid;
    this.tplGrid.config.innerComponents = null;
    // this.tplGrid.dataset.columns = '300px 1fr';
    this.tplMain.config.innerComponents = null;
    this.tplSidebar.config.innerComponents = null;

    this.innerHTML = '';
    this.append(this.tplGrid);

    this.tplGrid.append(this.tplSidebar, this.tplMain);

    await this.tplSidebar.initialization;
    await this.tplMain.initialization;

    this.tplMain.append(...content);
  }

  async initStructure() {
    const structureComponents = getMetaGroup(metaTags.structure.metaNamePrefix, { getFallback: false });
    this.structureComponents = structureComponents.flatMap(({ name, content }) => {
      if (content !== true) return [];
      const { targetsSelectors } = this.config.structure[name] || {};
      return {
        componentName: name.trim(),
        targets: [document],
        loaderConfig: {
          ...(targetsSelectors && { targetsSelectors }),
          targetsAsContainers: true,
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
