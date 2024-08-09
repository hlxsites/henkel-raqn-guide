import ComponentBase from '../../scripts/component-base.js';
import component from '../../scripts/init.js';
import { popupState } from '../../scripts/libs.js';

export default class PopupTrigger extends ComponentBase {
  static observedAttributes = ['data-active', 'data-url'];

  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    targetsSelectors: 'a:is([href*="#popup-trigger"],[href*="#popup-close"])',
    targetsAsContainers: true,
  };

  dependencies = ['popup'];

  nestedComponentsConfig = {};

  get isActive() {
    return this.dataset.active === 'true';
  }

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        elements: {
          popupBtn: 'button',
        },
        closePopupIdentifier: '#popup-close',
      },
    ];
  }

  setDefaults() {
    super.setDefaults();
    this.isClosePopupTrigger = false;
    this.ariaLabel = null;
    this.popupSourceUrl = null;
  }

  onInit() {
    this.createButton();
    this.popupBtn.append(...this.childNodes);
    this.append(this.popupBtn);
    this.processTargetAnchor();
  }

  processTargetAnchor() {
    const { target: anchor } = this.initOptions;
    const { closePopupIdentifier } = this.config;
    const anchorUrl = new URL(anchor.href);

    if (anchorUrl.hash === closePopupIdentifier) {
      this.isClosePopupTrigger = true;
    } else {
      this.dataset.url = anchorUrl.pathname;
    }

    if (anchor.hasAttribute('aria-label')) {
      this.ariaLabel = anchor.getAttribute('aria-label');
      this.popupBtn.setAttribute('aria-label', this.ariaLabel);
    }
  }

  addContentFromTarget() {
    const { target } = this.initOptions;
    this.popupBtn.append(...target.childNodes);
  }

  createButton() {
    this.popupBtn = document.createElement('button');
    this.popupBtn.setAttribute('aria-expanded', 'false');
    this.popupBtn.setAttribute('aria-haspopup', 'true');
    this.popupBtn.setAttribute('type', 'button');
  }

  addListeners() {
    this.popupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.dataset.active = !this.isActive;
    });
  }

  onAttributeUrlChanged({ oldValue, newValue }) {
    if (this.isClosePopupTrigger) return;
    if (oldValue === newValue) return;
    let sourceUrl;

    try {
      sourceUrl = new URL(newValue, window.location.origin);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('The value provided is not a valid path', error);
      return;
    }

    this.popupSourceUrl = sourceUrl.pathname;

    if (this.popup) {
      this.popup.dataset.url = this.popupSourceUrl;
    }
  }

  onAttributeActiveChanged({ oldValue, newValue }) {
    if (!this.initialized) return;
    if (oldValue === newValue) return;

    this.closeActivePopup();

    this.loadPopup();
  }

  closeActivePopup() {
    if (this.isClosePopupTrigger) {
      if (this.isActive) popupState.closeActivePopup();
    }
  }

  async loadPopup() {
    if (this.isClosePopupTrigger) return;
    if (!this.isActive) return;

    this.popup = await this.createPopup();
    this.addPopupToPage();
    // the icon is initialize async by page loader
    this.triggerIcon = this.querySelector('raqn-icon');

    // Reassign to just toggle after the popup is created;
    this.loadPopup = this.togglePopup;
    this.togglePopup();
  }

  async createPopup() {
    await component.loadAndDefine('popup');
    const popup = document.createElement('raqn-popup');

    popup.dataset.url = this.popupSourceUrl;
    popup.dataset.active = true;
    popup.dataset.type = 'flyout';

    popup.popupTrigger = this;
    return popup;
  }

  togglePopup() {
    this.popup.dataset.active = this.isActive;
    this.popupBtn.setAttribute('aria-expanded', this.isActive);
    if (this.triggerIcon) {
      this.triggerIcon.dataset.active = this.isActive;
    }
    if (!this.isActive) {
      this.popupBtn.focus();
    }
  }

  addPopupToPage() {
    if (!this.popup) return;
    document.body.append(this.popup);
  }
}
