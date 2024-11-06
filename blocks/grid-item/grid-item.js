import ComponentBase from '../../scripts/component-base.js';

export default class GridItem extends ComponentBase {
  static observedAttributes = [
    'data-order',
    'data-sticky',
    'data-column',
    'data-row',
    'data-area',
    'data-justify',
    'data-align',
  ];

  gridParent = null;

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

  init() {
    super.init();
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
}
