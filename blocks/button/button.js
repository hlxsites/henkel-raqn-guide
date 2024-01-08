import { Column } from '../column/column.js';

class Button extends Column {
  render() {
    this.block.setAttribute('role', 'button');
    this.block.setAttribute('tabindex', '0');
  }
}

export default async function button(block) {
  console.log('block', block);
  await new Button(block);
}
