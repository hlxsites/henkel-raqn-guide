import ComponentBase from '../../scripts/component-base.js';
import { flat, stringToJsVal } from '../../scripts/libs.js';

export default class Grid extends ComponentBase {
  // only one attribute is observed rest is set as css variables directly
  static observedAttributes = ['data-reverse'];

  attributesValues = {
    all: {
      grid: {
        gap: '20px',
      },
    },
  };

  // use `grid` item as action from component base and apply those as css variables
  // dinamic from {@link ../scripts/component-base.js:runConfigsByViewports}
  // EG ${viewport}-grid-${attr}-"${value}"
  applyGrid(grid) {
    const f = flat(grid);
    Object.keys(f).forEach((key) => {
      this.style.setProperty(`--grid-${key}`, f[key]);
    });
  }

  // for backwards compatibility
  applyData(data) {
    ['columns', 'rows'].forEach((key) => {
      if (data[key]) {
        if (data.template) {
          data.template[key] = data[key];
        } else {
          data.template = { [key]: data[key] };
        }
      }
    });
    this.applyGrid(data);
  }

  async onAttributeReverseChanged({ oldValue, newValue }) {
    // await for initialization because access to this.gridItems is required;
    await this.initialization;

    if (oldValue === newValue) return;

    const val = stringToJsVal(newValue);
    const reverse = val === true || newValue === 'alternate';

    let items = [...this.children];

    switch (val) {
      case true:
        items = [...this.children].reverse();
        break;
      case 'alternate':
        items = this.alternateReverse();
        break;
      default:
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
    return [...this.children].reduce((acc, x, i, arr) => {
      if ((i + 1) % 2) {
        if (arr.length === i + 1) acc.push(x);
        return acc;
      }
      acc.push(x, arr[i - 1]);
      return acc;
    }, []);
  }
}
