import ComponentBase from '../../../scripts/component-base.js';

export default class Input extends ComponentBase {
  static observedAttributes = ['schema'];

  connected() {
    console.log('init');
  }

  // parse json schema and load any external $ref
}
