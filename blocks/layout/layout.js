import ComponentBase from '../../scripts/component-base.js';

export default class Layout extends ComponentBase {
  static observedAttributes = [
    'data-reverse',
    'data-columns',
    'data-rows', // value can be any valid css value or a number which creates as many equal rows
  ];

  connected() {
    console.log('connected', this);
  }
}
