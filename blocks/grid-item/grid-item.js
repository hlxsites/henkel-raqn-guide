import ComponentBase from '../../scripts/component-base.js';
import { globalConfig } from '../../scripts/libs.js';

export default class Grid extends ComponentBase {
  static observedAttributes = [
    'data-level',
    'data-order',
    'data-sticky',
    'data-column',
    'data-row',
    'data-area',
    'data-justify',
    'data-align',
  ];

  // nestedComponentsConfig = {};

  attributesValues = {
    all: {
      data: {
        level: 1,
      },
    },
  };

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        innerComponents: globalConfig.blockSelector,
      },
    ];
  }

  setDefaults() {
    super.setDefaults();

    this.gridParent = null;
  }

  get siblingsItems() {
    return this.gridParent.gridItems.filter((x) => x !== this);
  }

  get logicalOrder() {
    return this.gridParent.gridItems.indexOf(this) + 1;
  }

  get areaName() {
    return `item-${this.logicalOrder}`;
  }

  // This method is called by the gridParent when a grid-template-areas is set.
  setAutoAreaName(add = true) {
    if (add) {
      this.dataset.area = this.areaName;
    } else {
      delete this.dataset.area;
    }
  }

  ready() {
    this.gridParent ??= this.parentElement;
  }

  onAttributeOrderChanged({ oldValue, newValue }) {
    this.setStyleProp('--grid-item-order', oldValue, newValue);
  }

  // grid-column doesn't work with value from css variable;
  onAttributeColumnChanged({ oldValue, newValue }) {
    this.setStyleProp('grid-column', oldValue, newValue);
  }

  // grid-row doesn't work with value from css variable;
  onAttributeRowChanged({ oldValue, newValue }) {
    this.setStyleProp('grid-row', oldValue, newValue);
  }

  // grid-area doesn't work with value from css variable;
  onAttributeAreaChanged({ oldValue, newValue }) {
    this.setStyleProp('grid-area', oldValue, newValue);
  }

  onAttributeJustifyChanged({ oldValue, newValue }) {
    this.setStyleProp('--grid-item-justify', oldValue, newValue);
  }

  onAttributeAlignChanged({ oldValue, newValue }) {
    this.setStyleProp('--grid-item-align', oldValue, newValue);
  }

  setStyleProp(prop, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (newValue) {
      this.style.setProperty(prop, newValue);
    } else {
      this.style.removeProperty(prop);
    }
  }

  addEDSHtml() {
    if (!this.isInitAsBlock) return;

    this.recursiveItems(this.previousElementSibling);
  }

  recursiveItems(elem) {
    if (!elem) return;
    if (this.isGridItem(elem)) return;
    if (this.isRaqnGrid(elem)) return;

    this.prepend(elem);

    this.recursiveItems(this.previousElementSibling);
  }

  isGridItem(elem) {
    return elem.tagName === 'DIV' && elem.classList.contains('grid-item');
  }

  isRaqnGrid(elem) {
    return elem.tagName === 'RAQN-GRID-ITEM';
  }
}
