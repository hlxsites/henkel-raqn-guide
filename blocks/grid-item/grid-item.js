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
