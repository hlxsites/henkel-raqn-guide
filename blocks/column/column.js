import ComponentBase from '../../scripts/component-base.js';

export default class Column extends ComponentBase {
  static observedAttributes = ['data-position', 'data-size', 'data-justify'];

  connected() {
    this.position = parseInt(this.dataset.position, 10);
    this.calculateGridTemplateColumns();
  }

  calculateGridTemplateColumns() {
    if (this.dataset.justify) {
      this.style.setProperty('justify-content', this.dataset.justify);
    }
    if (this.position) {
      const parent = this.parentElement;
      const children = Array.from(parent.children);
      parent.classList.add('raqn-grid');
      let parentGridTemplateColumns = parent.style.getPropertyValue('--grid-template-columns');
      if (!parentGridTemplateColumns) {
        // we have no grid template columns yet
        parentGridTemplateColumns = children
          .map((child, index) => {
            if (this.position === index + 1) {
              return this.dataset.size || 'auto';
            }
            return 'auto';
          })
          .join(' ');
        // set the new grid template columns
        parent.style.setProperty('--grid-template-columns', parentGridTemplateColumns);
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
              return this.dataset.size || 'auto';
            }
            // we have a non standard value for this position and we are at a position before the prio
            if (hasValue && isPosition && isBeforePrio) {
              return this.dataset.size || size;
            }
            return size;
          })
          .join(' ');
        // set the new grid template columns
        parent.style.setProperty('--grid-template-columns', parentGridTemplateColumns);
      }
      this.style.gridColumn = this.position;
      this.style.gridRow = 1;
    }
  }
}
