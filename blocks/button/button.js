import ComponentBase from '../../scripts/component-base.js';

export default class Button extends ComponentBase {
  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    targetsSelectors: ':is(p,div):has(> a:only-child)',
    selectorTest: (el) => el.childNodes.length === 1,
  };

  nestedComponentsConfig = {
    columns: {
      componentName: 'columns',
      active: false,
      loaderConfig: {
        targetsAsContainers: false,
      },
    },
  };

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        targetsAsContainers: {
          addToTargetMethod: 'append',
        },
      },
    ];
  }
}
