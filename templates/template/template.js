import ComponentBase from '../../scripts/component-base.js';
import component from '../../scripts/init.js';
import { metaTags, getMetaGroup } from '../../scripts/libs.js';

export default class Template extends ComponentBase {
  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    targetsSelectors: ':scope > main',
  };

  nestedComponentsConfig = {};

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        // only init EDS sections
        innerComponents: ':scope > div',
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
    await this.initStructure();
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

  ready() {
    this.initFooter();
  }
}
