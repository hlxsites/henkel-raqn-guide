import ComponentBase from '../../scripts/component-base.js';

export default class Button extends ComponentBase {
  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        selectors: {
          anchor: ':scope > a',
          ariaText: ':scope > a:has(> raqn-icon, > .icon) > strong',
        },
      },
    ];
  }

  init() {
    super.init();
    this.queryElements();
    this.wrapText();
    this.addAriaText();
  }

  wrapText() {
    const { anchor, ariaText } = this.elements;
    const wrap = document.createElement('span');
    if (ariaText) return;
    if (!anchor.childNodes) return;
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
