import ComponentBase from '../../scripts/component-base.js';
import { flat } from '../../scripts/libs.js';

export default class Grid extends ComponentBase {
  nestedComponentsConfig = {};

  gridElements = [];

  gridItemsElements = [];

  attributesValues = {
    all: {
      grid: {
        template: {
          columns: '1fr 1fr 1fr',
          rows: '1fr 1fr',
        },
        gap: '20px',
      },
    },
  };

  applyGrid(grid) {
    const f = flat(grid);
    Object.keys(f).forEach((key) => {
      this.style.setProperty(`--grid-${key}`, f[key]);
    });
  }

  async connected() {
    await this.collectGridItemsFromBlocks();
  }

  async collectGridItemsFromBlocks() {
    await this.checkIndexes(this.nextElementSibling);
  }

  async checkIndexes() {
    const siblings = Array.from(this.parentNode.children);
    // check index of this element
    this.dataset.index = siblings.indexOf(this);
    // verify other grid elements
    this.gridElements = Array.from(this.parentNode.querySelectorAll('raqn-grid')).filter((grid) => {
      grid.dataset.index = siblings.indexOf(grid);
      return grid.dataset.index > this.dataset.index;
    });
    // get max index of the next grid item
    const nextGrid = this.gridElements.length > 0 ? siblings.indexOf(this.gridElements[0]) : siblings.length;
    // get all grid items between this and next grid
    this.gridItemsElements = Array.from(this.parentNode.querySelectorAll('.grid-item')).filter((item) => {
      item.dataset.index = siblings.indexOf(item);
      return item.dataset.index > siblings.indexOf(this) && item.dataset.index <= nextGrid;
    });

    let previous = siblings.indexOf(this) + 1;

    return Promise.allSettled(
      this.gridItemsElements.map(async (item) => {
        const children = Array.from(this.parentNode.children).slice(previous, item.dataset.index - 1);
        const configByClasses = [...item.classList];
        previous = item.dataset.index;
        item.remove();
        return this.createGridItem(children, configByClasses);
      }),
    );
  }

  async createGridItem(children, configByClasses) {
    const tempGridItem = document.createElement('raqn-grid-item');
    tempGridItem.init({ configByClasses });
    tempGridItem.append(...children);
    await this.append(tempGridItem);
    return tempGridItem;
  }
}
