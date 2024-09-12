import ComponentBase from '../../scripts/component-base.js';
import { stringToJsVal } from '../../scripts/libs.js';
import component from '../../scripts/init.js';

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

  setDefaults() {
    super.setDefaults();
  }

  get gridItems() {
    return [...this.children];
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

  async connected() {
    await this.collectGridItemsFromBlocks();
  }

  ready() {
    this.cleanGridItems();
  }

  cleanGridItems() {
    // Get all the grid items and remove any non grid item element.
    return [...this.children].filter((child) => child.matches('raqn-grid-item') || child.remove());
  }

  async collectGridItemsFromBlocks() {
    if (!this.isInitAsBlock) return;

    await this.recursiveItems(this.nextElementSibling);
  }

  async recursiveItems(elem, children = []) {
    if (!elem) return;
    if (this.isForbiddenGridItem(elem)) return;
    if (this.isForbiddenBlockGrid(elem)) return;
    if (this.isForbiddenRaqnGrid(elem)) return;

    if (this.isThisGridItem(elem)) {
      await this.createGridItem([...children], [...elem.classList]);
      await this.recursiveItems(elem.nextElementSibling, []);
      elem.remove();
      return;
    }

    children.push(elem);

    await this.recursiveItems(elem.nextElementSibling, children);
  }

  getLevel(elem = this) {
    return Number(elem.dataset.level);
  }

  getLevelFromClass(elem) {
    const levelClass = [...elem.classList].find((cls) => cls.startsWith('data-level-')) || 'data-level-1';
    return Number(levelClass.slice('data-level-'.length));
  }

  isGridItem(elem) {
    return elem.tagName === 'DIV' && elem.classList.contains('grid-item');
  }

  isThisGridItem(elem) {
    return this.isGridItem(elem) && this.getLevelFromClass(elem) === this.getLevel();
  }

  isForbiddenGridItem(elem) {
    return this.isGridItem(elem) && this.getLevelFromClass(elem) > this.getLevel();
  }

  isBlockGrid(elem) {
    return elem.tagName === 'DIV' && elem.classList.contains('grid');
  }

  isRaqnGrid(elem) {
    return elem.tagName === 'RAQN-GRID';
  }

  isForbiddenRaqnGrid(elem) {
    return this.isRaqnGrid(elem) && this.getLevel() >= this.getLevel(elem);
  }

  isForbiddenBlockGrid(elem) {
    return this.isBlockGrid(elem) && this.getLevelFromClass(elem) <= this.getLevel();
  }

  async createGridItem(children, configByClasses) {
    await component.loadAndDefine('grid-item');
    const tempGridItem = document.createElement('raqn-grid-item');
    tempGridItem.init({ configByClasses });
    tempGridItem.gridParent = this;
    tempGridItem.append(...children);
    this.gridItems.push(tempGridItem);
    this.append(tempGridItem);
  }
}
