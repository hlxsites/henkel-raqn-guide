import ComponentBase from '../../scripts/component-base.js';
import {
  globalConfig,
  stringToJsVal,
  popupState,
  focusTrap,
  focusFirstElementInContainer,
  blockBodyScroll,
} from '../../scripts/libs.js';

/**
 * TODO Consider updating the component to use the new native features:
 * the <dialog> element https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
 * or the popover https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/popover
 */
export default class Popup extends ComponentBase {
  static observedAttributes = ['data-url', 'data-active', 'data-type', 'data-size', 'data-offset', 'data-height'];

  configPopupAttributes = ['data-type', 'data-size', 'data-offset', 'data-height'];

  elements = {
    /**
     * Optional special property to set a reference to a popupTrigger element which controls this popup.
     * This will automatically control the states of the popupTrigger based on popup interaction.
     */
    popupTrigger: null,
  };

  get isActive() {
    return this.dataset.active !== 'true';
  }

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        addFragmentContentOnInit: false,
        showCloseBtn: true,
        selectors: {
          popupBase: '.popup__base',
          popupContainer: '.popup__container',
          popupStyles: '.popup__container > style',
          popupContent: '.popup__content',
          popupOverlay: '.popup__overlay',
          popupCloseBtn: '.popup__close-btn',
          fragmentTarget: '.popup__container',
        },
        elements: {
          sourceUrlAnchor: 'a',
        },
        classes: {
          popupClosing: 'popup__base--closing',
          popupFlyout: 'popup__base--flyout',
          hide: 'hide',
        },
      },
    ];
  }

  setBinds() {
    super.setBinds();
    this.closeOnEsc = this.closeOnEsc.bind(this);
  }

  init() {
    this.showPopup(false);
    this.createPopupHtml();
    this.queryElements();
    this.addListeners();
    focusTrap(this.elements.popupContainer, { dynamicContent: true });
    this.activeOnConnect();
  }

  createPopupHtml() {
    this.innerHTML = this.template();
  }

  setUrlFromTarget() {
    const { target } = this.initOptions;

    if (!target || this.dataset.url) return;
    const sourceUrlAnchor = target.querySelector(this.config.elements.sourceUrlAnchor);

    if (!sourceUrlAnchor) return;
    const sourceUrl = new URL(sourceUrlAnchor.href);
    this.dataset.url = sourceUrl.pathname;
  }

  template() {
    return `
    <div class="popup__base ${this.dataset.type === 'flyout' ? this.config.classes.popupFlyout : ''}">
      <div class="popup__overlay"></div>
      <div class="popup__container"
        role="dialog"
        aria-popup="true">
          ${
            this.config.showCloseBtn
              ? '<button type="button" class="popup__close-btn"><raqn-icon data-icon="close"></raqn-icon></button>'
              : ''
          }
          <div class="popup__content"></div>
      </div>`;
  }

  addListeners() {
    super.addListeners();
    this.elements.popupCloseBtn.addEventListener('click', () => {
      this.dataset.active = false;
    });
    this.elements.popupOverlay.addEventListener('click', () => {
      this.dataset.active = false;
    });
  }

  activeOnConnect() {
    if (this.isActive) return;

    this.openPopup();
  }

  async addFragmentContent() {
    this.elements.popupContent.append(...this.fragmentContent);
  }

  setInnerBlocks() {
    const innerBlocks = [...this.elements.popupContent.querySelectorAll(globalConfig.blockSelector)];
    this.innerBlocks = innerBlocks;
  }

  onAttributeUrlChanged({ oldValue, newValue }) {
    if (newValue === oldValue) return;
    this.fragmentPath = `${newValue}.plain.html`;
    if (!this.initialized) return;
    this.loadFragment(this.fragmentPath);
  }

  onAttributeActiveChanged({ oldValue, newValue }) {
    if (!this.initialized) return;
    if (newValue === oldValue) return;
    const parsedVal = stringToJsVal(newValue);

    if (!parsedVal) {
      this.closePopup();
      return;
    }

    if (parsedVal === true) {
      this.openPopup();
    }
  }

  onAttributeSizeChanged({ name, oldValue, newValue }) {
    if (newValue === oldValue) return;
    if (this.betweenMinMax(name, newValue, { min: 1, max: 12 })) return;

    this.style.setProperty('--popup-grid-area-size', newValue);
  }

  onAttributeOffsetChanged({ name, oldValue, newValue }) {
    if (newValue === oldValue) return;
    if (this.betweenMinMax(name, newValue, { min: 1, max: 12 })) return;

    this.style.setProperty('--popup-grid-area-start', newValue);
  }

  onAttributeTypeChanged({ name, oldValue, newValue }) {
    if (newValue === oldValue) return;
    const modal = 'modal';
    const flyout = 'flyout';
    if (![modal, flyout].some((type) => type === newValue)) {
      this.dataset.type = modal;
      // eslint-disable-next-line no-console
      console.warn(`Values for attribute "${name}" must be "${modal}" or "${flyout}"`, this);
      return;
    }

    if (!this.elements.popupBase) return;
    this.elements.popupBase.classList.toggle(this.config.classes.popupFlyout, newValue === flyout);
  }

  onAttributeHeightChanged({ oldValue, newValue }) {
    if (newValue === oldValue) return;
    this.style.setProperty('--popup-content-height', newValue);
  }

  betweenMinMax(name, newValue, { min, max }) {
    const Nr = Number(newValue);
    const betweenMinMax = (Nr <= min && min) || (Nr >= max && max) || Nr;

    if (betweenMinMax === Nr) return false;

    // reset value to min or max
    this.setAttribute(name, betweenMinMax);
    // eslint-disable-next-line no-console
    console.warn(`Values for attribute "${name}" must be between ${min} and ${max}`, this);
    return true;
  }

  closePopup() {
    popupState.activePopup = null;
    blockBodyScroll(false);
    this.updatePopupTrigger(false);
    this.toggleCloseOnEsc(false);
    this.classList.add('popup--closing');
    setTimeout(() => {
      this.showPopup(false);
      this.removeContent();
      this.classList.remove('popup--closing');
    }, 200);
  }

  async openPopup() {
    popupState.closeActivePopup();
    popupState.activePopup = this;

    blockBodyScroll(true);
    await this.addFragmentContent();
    this.setInnerBlocks();
    this.showPopup(true);
    this.updatePopupTrigger(true);
    this.toggleCloseOnEsc(true);
    focusFirstElementInContainer(this.elements.popupContainer);
  }

  toggleCloseOnEsc(boolean) {
    const eventHandler = boolean ? 'addEventListener' : 'removeEventListener';
    document[eventHandler]('keydown', this.closeOnEsc);
  }

  closeOnEsc(e) {
    if (e.code === 'Escape') {
      this.dataset.active = false;
    }
  }

  removeContent() {
    this.elements.popupContent.innerHTML = '';
  }

  updatePopupTrigger(isActive) {
    if (this.elements.popupTrigger) this.elements.popupTrigger.dataset.active = isActive;
  }

  showPopup(boolean) {
    const { hide } = this.config.classes;
    this.classList.toggle(hide, !boolean);
  }
}
