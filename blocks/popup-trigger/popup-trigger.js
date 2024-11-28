import ComponentBase from '../../scripts/component-base.js';
import { componentList } from '../../scripts/component-list/component-list.js';
import { popupState, loadAndDefine } from '../../scripts/libs.js';

export default class PopupTrigger extends ComponentBase {
  static observedAttributes = ['data-active', 'data-action'];

  isClosePopupTrigger = false;

  popupSourceUrl = null;

  popupConfigId = null;

  elements = {
    popup: null,
  };

  get isActive() {
    return this.dataset.active === 'true';
  }

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        selectors: {
          popupBtn: 'button',
          triggerIcon: 'raqn-icon',
        },
        closePopupIdentifier: '#popup-close',
        triggerPopupIdentifier: '#popup-trigger',
      },
    ];
  }

  init() {
    this.setAction(this.dataset.action);
    super.init();
  }

  setAction(action) {
    const sourceUrl = URL.parse(action, window.location.origin);
    if (!sourceUrl) {
      // eslint-disable-next-line no-console
      console.warn(`The value provided is not a valid path: ${action}`);
      return;
    }

    const { closePopupIdentifier, triggerPopupIdentifier } = this.config;

    if (sourceUrl.hash === closePopupIdentifier) {
      this.isClosePopupTrigger = true;
      return;
    }

    this.popupSourceUrl = sourceUrl.pathname;

    const [, configId] = sourceUrl.hash.split(`${triggerPopupIdentifier}-`);

    if (configId) this.popupConfigId = configId;
  }

  addListeners() {
    super.addListeners();
    this.elements.popupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.dataset.active = !this.isActive;
    });
  }

  onAttributeActionChanged({ oldValue, newValue }) {
    if (!this.initialized) return;
    if (this.isClosePopupTrigger) return;
    if (oldValue === newValue) return;

    this.setAction(newValue);

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

    await this.createPopup();
    this.addPopupToPage();

    // Reassign to just toggle after the popup is created;
    this.loadPopup = this.togglePopup;
    this.togglePopup();
  }

  async createPopup() {
    await loadAndDefine(componentList.popup);

    const popupEl = document.createElement('raqn-popup');
    popupEl.dataset.url = this.popupSourceUrl;
    popupEl.dataset.active = true;
    // link popup with popup-trigger
    popupEl.elements.popupTrigger = this;
    if (this.popupConfigId) popupEl.setAttribute('config-id', this.popupConfigId);

    this.elements.popup = popupEl;
  }

  togglePopup() {
    this.elements.popup.dataset.active = this.isActive;
    this.elements.popupBtn.setAttribute('aria-expanded', this.isActive);
    if (this.elements.triggerIcon) {
      this.elements.triggerIcon.dataset.active = this.isActive;
    }
    if (!this.isActive) {
      this.elements.popupBtn.focus();
    }
  }

  addPopupToPage() {
    if (!this.elements.popup) return;
    document.body.append(this.elements.popup);
  }
}
