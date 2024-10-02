import ComponentBase from '../../scripts/component-base.js';

export default class Button extends ComponentBase {
  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    targetsSelectors: ':is(p,div):has(> a[href]:only-child)',
    selectorTest: (el) => el.childNodes.length === 1,
  };

  nestedComponentsConfig = {
    popupTrigger: {
      componentName: 'popup-trigger',
    },
  };

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        targetsAsContainers: {
          addToTargetMethod: 'append',
        },
        selectors: {
          anchor: ':scope > a',
          ariaText: ':scope > a:has(> raqn-icon, > .icon) > strong',
        },
      },
    ];
  }

  addEDSHtml() {
    this.initAsBlock();
    this.queryElements();
    this.wrapText();
    this.addAriaText();
  }

  initAsBlock() {
    if (!this.isInitAsBlock) return;
    const anchor = this.querySelector('a');
    this.innerHTML = '';
    if (!anchor) {
      throw new Error(`No anchor found in the "${this.componentName}" block`);
    }
    this.append(anchor);
  }

  wrapText() {
    const { anchor, ariaText } = this.elements;
    const wrap = document.createElement('span');
    if (ariaText) return;
    const label = [...anchor.childNodes].find(({ nodeName }) => nodeName === '#text');
    if (!label) return;
    wrap.textContent = label.textContent;
    label.replaceWith(wrap);
  }

  addAriaText() {
    const { anchor, ariaText } = this.elements;
    if (!ariaText) return;
    anchor.setAttribute('aria-label', ariaText.textContent);
    ariaText.remove();
  }
}
