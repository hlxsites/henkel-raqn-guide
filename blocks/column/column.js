import ComponentBase from '../../scripts/component-base.js';

export class Column extends ComponentBase {
  static observedAttributes() {
    return ['position', 'size'];
  }

  connected() {
    this.calculateGridTemplateColumns();
  }

  calculateGridTemplateColumns() {
    this.position = parseInt(this.block.getAttribute('position'), 10);
    this.size = this.block.getAttribute('size');
    this.justify = this.block.getAttribute('justify') || 'stretch';
    if (this.justify) {
      this.block.style.justifyContent = this.justify;
    }
    if (this.position) {
      const parent = this.block.parentElement;
      const children = Array.from(parent.children);
      this.block.parentElement.classList.add('raqn-grid');
      let parentGridTemplateColumns = parent.style.getPropertyValue(
        '--grid-template-columns',
      );
      if (!parentGridTemplateColumns) {
        // we have no grid template columns yet
        parentGridTemplateColumns = children
          .map((child, index) => {
            if (this.position === index + 1) {
              return this.size || 'auto';
            }
            return 'auto';
          })
          .join(' ');
        // set the new grid template columns
        parent.style.setProperty(
          '--grid-template-columns',
          parentGridTemplateColumns,
        );
      } else {
        const { position } = this;
        const prio = children.indexOf(this) + 1;
        parentGridTemplateColumns = parentGridTemplateColumns
          .split(' ')
          .map((size, i) => {
            // we have a non standard value for this position
            const hasValue = size !== 'auto';
            // we are at the position
            const isPosition = i + 1 === position;
            // we are at a position before the prio
            const isBeforePrio = i + 1 <= prio;
            // we have a non standard value for this position and we are at the position
            if (!hasValue && isPosition) {
              return this.size || 'auto';
            }
            // we have a non standard value for this position and we are at a position before the prio
            if (hasValue && isPosition && isBeforePrio) {
              return this.size || size;
            }
            return size;
          })
          .join(' ');
        // set the new grid template columns
        parent.style.setProperty(
          '--grid-template-columns',
          parentGridTemplateColumns,
        );
      }
      this.block.style.gridColumn = this.position;
      this.block.style.gridRow = 1;
    }
  }
}

export default async function col(block) {
  await new Column(block);
}
