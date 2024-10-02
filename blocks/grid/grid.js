import ComponentBase from '../../scripts/component-base.js';
import { stringToJsVal } from '../../scripts/libs.js';

export default class Grid extends ComponentBase {
  static observedAttributes = [
    'data-level',
    'data-height',
    'data-width',
    'data-reverse',
    'data-columns', // value can be any valid css value or a number which creates as many equal columns
    'data-rows', // value can be any valid css value or a number which creates as many equal rows
    'data-auto-columns',
    'data-auto-rows',
    'data-areas',
    'data-justify-items',
    'data-align-items',
    'data-justify-content',
    'data-align-content',
  ];

  nestedComponentsConfig = {};

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
        innerComponents: ':scope > .grid-item',
      },
    ];
  }

  get gridItems() {
    return [...this.children].filter((el) => el.tagName.toLowerCase() === 'raqn-grid-item');
  }

  onAttributeHeightChanged({ oldValue, newValue }) {
    this.setStyleProp('height', oldValue, newValue);
  }

  onAttributeWidthChanged({ oldValue, newValue }) {
    this.setStyleProp('width', oldValue, newValue);
  }

  async onAttributeReverseChanged({ oldValue, newValue }) {
    // await for initialization because access to this.gridItems is required;
    await this.initialization;

    if (oldValue === newValue) return;

    const val = stringToJsVal(newValue);
    const reverse = val === true || newValue === 'alternate';

    let items = this.gridItems;

    switch (val) {
      case true:
        items = [...this.gridItems].reverse();
        break;
      case 'alternate':
        items = this.alternateReverse();
        break;
      default:
        items = this.gridItems;
        break;
    }

    items.forEach((item, index) => {
      if (reverse) {
        item.dataset.order = index + 1;
      } else {
        delete item.dataset.order;
      }
    });
  }

  // swaps every 2 items [1,2,3,4,5,6,7] => [2,1,4,3,6,5,7]
  alternateReverse() {
    return this.gridItems.reduce((acc, x, i, arr) => {
      if ((i + 1) % 2) {
        if (arr.length === i + 1) acc.push(x);
        return acc;
      }
      acc.push(x, arr[i - 1]);
      return acc;
    }, []);
  }

  onAttributeColumnsChanged({ oldValue, newValue }) {
    this.setRowsOrColumns('columns', oldValue, newValue);
  }

  onAttributeRowsChanged({ oldValue, newValue }) {
    this.setRowsOrColumns('rows', oldValue, newValue);
  }

  setRowsOrColumns(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    const tplCol = `--grid-tpl-${name}`;
    const col = `--grid-${name}`;

    if (!newValue) {
      this.style.removeProperty(tplCol);
      this.style.removeProperty(col);
      return;
    }

    const nrOfCols = Number(newValue);

    if (nrOfCols) {
      this.style.removeProperty(tplCol);
      this.style.setProperty(col, nrOfCols);
      return;
    }

    this.style.removeProperty(col);
    this.style.setProperty(tplCol, newValue.replace(/-+/g, ' '));
  }

  onAttributeAutoColumnsChanged({ oldValue, newValue }) {
    this.setStyleProp('auto-columns', oldValue, newValue);
  }

  onAttributeAutoRowsChanged({ oldValue, newValue }) {
    this.setStyleProp('auto-rows', oldValue, newValue);
  }

  /**
   * Grid areas names should be defined using the following pattern:
   * `item-{index}`
   * where index is the grid item position starting from 1 as a child element of the grid;
   *
   * The grid-template-area should be defined with an equal amount of areas as the number of grid items.
   *
   * The grid-area with the same pattern is automatically set on the grid item when grid-template-area is set
   * on the grid using data-areas attribute;
   */
  async onAttributeAreasChanged({ oldValue, newValue }) {
    // await for initialization because access to this.gridItems is required;
    await this.initialization;
    const cleanValue = newValue.replace(/"\s+"/g, '" "').replace(/\n+|^\s+|\s+$/g, '');

    // For validation check if the areas template includes all grid items
    const missingItems = [];

    this.gridItems.forEach((item) => {
      const areaCheck = cleanValue?.includes(item.areaName);
      item.setAutoAreaName(!!cleanValue && areaCheck);

      if (cleanValue && !areaCheck) {
        missingItems.push(item.areaName);
      }
    });

    if (missingItems.length) {
      // eslint-disable-next-line no-console
      console.warn(`The following items are not included in the areas template: ${missingItems.join(',')}`, this);
    }

    this.setStyleProp('tpl-areas', oldValue, cleanValue);
  }

  onAttributeJustifyItemsChanged({ oldValue, newValue }) {
    this.setStyleProp('justify-items', oldValue, newValue);
  }

  onAttributeAlignItemsChanged({ oldValue, newValue }) {
    this.setStyleProp('align-items', oldValue, newValue);
  }

  onAttributeJustifyContentChanged({ oldValue, newValue }) {
    this.setStyleProp('justify-content', oldValue, newValue);
  }

  onAttributeAlignContentChanged({ oldValue, newValue }) {
    this.setStyleProp('align-content', oldValue, newValue);
  }

  setStyleProp(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    const prop = `--grid-${name}`;
    if (newValue) {
      this.style.setProperty(prop, newValue);
    } else {
      this.style.removeProperty(prop);
    }
  }

  async addEDSHtml() {
    if (!this.isInitAsBlock) return;

    const elems = [...this.parentElement.children];

    const gridIndex = elems.indexOf(this);

    let children = elems.slice(gridIndex + 1);

    const lastItem = [...children].reverse().find((el) => el.matches('.grid-item'));
    const lastItemIndex = children.indexOf(lastItem);

    children = children.slice(0, lastItemIndex + 1);

    this.append(...children);
  }
}
