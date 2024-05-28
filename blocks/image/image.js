import ComponentBase from '../../scripts/component-base.js';

// Not supported as a block
export default class Image extends ComponentBase {
  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    targetsSelectors: 'p:has(>picture:only-child) + p:has(> em:only-child > a:only-child)',
    selectorTest: (el) => [el.childNodes.length, el.childNodes[0].childNodes.length].every((len) => len === 1),
    targetsAsContainers: true,
  };

  nestedComponentsConfig = {};

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        addToTargetMethod: 'append',
        targetsAsContainers: {
          addToTargetMethod: 'append',
        },
      },
    ];
  }

  connected() {
    this.createLinkedImage();
  }

  createLinkedImage() {
    if (!this.children) return;
    const em = this.firstElementChild;
    const anchor = em.firstElementChild;
    const pictureParent = this.parentElement.previousElementSibling;
    const picture = pictureParent.firstElementChild;
    anchor.setAttribute('aria-label', anchor.textContent);
    anchor.innerHTML = '';
    anchor.append(picture);
    this.append(anchor);
    em.remove();
    pictureParent.remove();
  }
}
