import Column from '../column/column.js';

export default class Button extends Column {
  render() {
    this.setAttribute('role', 'button');
    this.setAttribute('tabindex', '0');
  }
}
