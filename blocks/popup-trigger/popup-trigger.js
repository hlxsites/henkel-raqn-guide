import ComponentBase from '../../scripts/component-base.js';
import { componentList } from '../../scripts/component-list/component-list.js';
import { popupState, loadAndDefine } from '../../scripts/libs.js';

export default class PopupTrigger extends ComponentBase {
  static observedAttributes = ['data-active', 'data-action'];

  isClosePopupTrigger = false;

  ariaLabel = null;

  popupSourceUrl = null;

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
      },
    ];
  }

  init() {
    this.setAction();
    this.queryElements();
    this.addListeners();
  }

  setAction() {
    const { closePopupIdentifier } = this.config;
    const anchorUrl = new URL(this.dataset.action, window.location.origin);

    if (anchorUrl.hash === closePopupIdentifier) {
      this.isClosePopupTrigger = true;
      this.dataset.action = anchorUrl.hash;
    }
  }

  addListeners() {
    this.elements.popupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.dataset.active = !this.isActive;
    });
  }

  onAttributeActionChanged({ oldValue, newValue }) {
    if (this.isClosePopupTrigger) {
      return;
    }
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
    // this.triggerIcon = this.querySelector('raqn-icon');

    // Reassign to just toggle after the popup is created;
    this.loadPopup = this.togglePopup;
    this.togglePopup();
  }

  async createPopup() {
    loadAndDefine(componentList.popup);

    const popupEl = document.createElement('raqn-popup');
    popupEl.dataset.action = this.popupSourceUrl;
    popupEl.dataset.active = true;
    // Set the popupTrigger property of the popup component to this trigger instance
    popupEl.popupTrigger = this;
    return popupEl;
  }

  togglePopup() {
    this.popup.dataset.active = this.isActive;
    this.elements.popupBtn.setAttribute('aria-expanded', this.isActive);
    if (this.elements.triggerIcon) {
      this.elements.triggerIcon.dataset.active = this.isActive;
    }
    if (!this.isActive) {
      this.elements.popupBtn.focus();
    }
  }

  addPopupToPage() {
    if (!this.popup) return;
    document.body.append(this.popup);
  }
}
