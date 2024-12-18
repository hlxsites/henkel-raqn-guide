import Grid from '../grid/grid.js';

export default class Columns extends Grid {
  // only one attribute is observed rest is set as css variables directly
  static observedAttributes = ['data-reverse'];
}
