import component from '../../scripts/init.js';
import ComponentBase from '../../scripts/component-base.js';
import { globalConfig } from '../../scripts/libs.js';

export default class Section extends ComponentBase {
  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    targetsSelectors: ':scope > div',
  };

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        innerComponents: `:scope > ${globalConfig.blockSelector}`,
        nestedComponentsPrefix: ':scope > ',
      },
    ];
  }

  setInnerBlocks() {
    if (!this.config.innerComponents) return;

    const elems = [...this.querySelectorAll(this.config.innerComponents)];
    const grid = elems.find((el) => el.matches('.grid'));
    const gridIndex = elems.indexOf(grid);
    const lastItem = [...elems].reverse().find((el) => el.matches('.grid-item'));
    const lastItemIndex = elems.indexOf(lastItem);
    const preGridChildren = [...elems].slice(0, gridIndex + 1);
    const postGridChildren = [...elems].slice(lastItemIndex + 1);

    this.innerBlocks = [...preGridChildren, ...postGridChildren].map((elem) => component.getBlockData(elem));
    this.innerGrids = [];
  }

  addEDSHtml() {
    const grids = this.querySelectorAll('.grid');
    if (grids.length > 1) {
      if (window.raqnIsPreview) {
        this.innerHTML = '<h3>The content of this section is hidden because it contains more than 1 grid which is not supported. Please fix. </h3>';
        this.attributesValues.all ??= {};
        this.attributesValues.all.class ??= '';

        this.attributesValues.all.class += ' error-message';
        this.classList.add('error-message-box');

        // prevent hiding the component based on the throw error bellow
        this.config.hideOnInitError = false;
      }
      throw new Error('More then 1 grid configured in this section. Please fix.');
    }
  }
}
