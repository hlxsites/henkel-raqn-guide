import ComponentBase from '../../scripts/component-base.js';
import {
  globalConfig,
  stringToJsVal,
  popupState,
  focusTrap,
  focusFirstElementInContainer,
} from '../../scripts/libs.js';

/**
 * TODO Consider updating the component to use the new native features:
 * the <dialog> element https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
 * or the popover https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/popover
 */
export default class Popup extends ComponentBase {
  static observedAttributes = ['data-url', 'data-active', 'data-type', 'data-size', 'data-offset', 'data-height'];

  configPopupAttributes = ['data-type', 'data-size', 'data-offset', 'data-height'];

  dependencies = ['icon'];

  get isActive() {
    return this.dataset.active !== 'true';
  }

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        contentFromTargets: false,
        targetsAsContainers: {
          contentFromTargets: false,
        },
        showCloseBtn: true,
        selectors: {
          popupBase: '.popup__base',
          popupContainer: '.popup__container',
          popupStyles: '.popup__container > style',
          popupContent: '.popup__content',
          popupOverlay: '.popup__overlay',
          popupCloseBtn: '.popup__close-btn',
        },
        elements: {
          sourceUrlAnchor: 'a',
        },
        classes: {
          popupClosing: 'popup__base--closing',
          popupFlyout: 'popup__base--flyout',
          noScroll: 'no-scroll',
          hide: 'hide',
        },
      },
    ];
  }

  setDefaults() {
    super.setDefaults();
    this.popupTrigger = null;
    this.getConfigFromFragment = true;
  }

  setBinds() {
    this.closeOnEsc = this.closeOnEsc.bind(this);
  }

  onInit() {
    this.showPopup(false);
    this.createPopupHtml();
    this.setUrlFromTarget();
    this.queryElements();
    focusTrap(this.elements.popupContainer, { dynamicContent: true });
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
    <div class="popup__base">
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

  addContentFromTarget() {
    const { target } = this.initOptions;

    this.elements.popupContent.append(...target.childNodes);
  }

  addListeners() {
    this.elements.popupCloseBtn.addEventListener('click', () => {
      this.dataset.active = false;
    });
    this.elements.popupOverlay.addEventListener('click', () => {
      this.dataset.active = false;
    });
  }

  connected() {
    this.activeOnConnect();
  }

  activeOnConnect() {
    if (this.isActive) return;
    popupState.closeActivePopup();
    popupState.activePopup = this;

    this.blockBodyScroll(true);
    this.showPopup(true);
    this.toggleCloseOnEsc(true);
    focusFirstElementInContainer(this.elements.popupContainer);
  }

  async addFragmentContent() {
    if (this.getConfigFromFragment) {
      // ! needs to be run when the url changes
      this.initFromFragment();
      this.getConfigFromFragment = false;
      if (this.initialized) return;
    }

    this.elements.popupContent.innerHTML = await this.fragmentContent;
  }

  async initFromFragment() {
    const hostEl = document.createElement('div');
    hostEl.innerHTML = await this.fragmentContent;
    const configEl = hostEl.querySelector('.config-popup');

    if (!configEl) return;
    configEl.remove();
    this.fragmentContent = hostEl.innerHTML;
    const configByClass = (configEl.classList.toString()?.trim?.().split?.(' ') || []).filter(
      (c) => c !== 'config-popup',
    );

    const configPopupAttributes = ['data-type', 'data-size', 'data-offset', 'data-height'];
    await this.buildExternalConfig(null, configByClass, configPopupAttributes);

    this.mergeConfigs();
    this.setAttributesClassesAndProps();
    this.addDefaultsToNestedConfig();
  }

  setInnerBlocks() {
    const innerBlocks = [...this.elements.popupContent.querySelectorAll(globalConfig.blockSelector)];
    this.innerBlocks = innerBlocks;
  }

  onAttributeUrlChanged({ oldValue, newValue }) {
    if (newValue === oldValue) return;
    this.getConfigFromFragment = true;
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
    this.blockBodyScroll(false);
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

    this.blockBodyScroll(true);
    await this.addFragmentContent();
    this.setInnerBlocks();
    await this.initChildComponents();
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
    if (this.popupTrigger) this.popupTrigger.dataset.active = isActive;
  }

  blockBodyScroll(boolean) {
    const { noScroll } = this.config.classes;
    document.body.classList.toggle(noScroll, boolean);
  }

  showPopup(boolean) {
    const { hide } = this.config.classes;
    this.classList.toggle(hide, !boolean);
  }
}
