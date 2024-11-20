import ComponentBase from '../../scripts/component-base.js';
import { componentList } from '../../scripts/component-list/component-list.js';
import { stringToJsVal } from '../../scripts/libs.js';

export default class Grid extends ComponentBase {
  // only one attribute is observed rest is set as css variables directly
  static observedAttributes = ['data-reverse'];

  dependencies = componentList.grid.module.dependencies;

  attributesValues = {
    all :{
      style: {
        '--grid-gap': 'initial',
        '--grid-height': 'initial',
        '--grid-width': 'initial',
        '--grid-justify-items':' initial',
        '--grid-align-items':' initial',
        '--grid-justify-content':' initial',
        '--grid-align-content':' initial',
        '--grid-template-columns':' 1fr 1fr',
        '--grid-template-rows':' initial',
        '--grid-background': 'var(--background, black)',
        '--grid-color': 'var(--text, white)',
      },
    },
  };

  async onAttributeReverseChanged({ oldValue, newValue }) {
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
