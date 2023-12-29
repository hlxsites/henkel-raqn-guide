import Column from '../column/column.js';

export default class Navigation extends Column {
  constructor() {
    super();
    this.compact = this.getAttribute('compact') || false;
    this.icon = this.getAttribute('icon') || 'menu';
    console.log('Navigation', this.compact, this.icon);
  }
  connected() {
    super.connected();
  }
}
