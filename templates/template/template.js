import ComponentBase from '../../scripts/component-base.js';
import component from '../../scripts/init.js';
import { metaTags, getMetaGroup, stringToArray } from '../../scripts/libs.js';

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
        structureComponents: '',
        structureAddToTargetMethod: 'prepend',
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

  ready() {
    this.initFooter();
  }
}
