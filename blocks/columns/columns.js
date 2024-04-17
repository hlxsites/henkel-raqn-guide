import { collectAttributes } from '../../scripts/libs.js';

// ! Solution 2 to remove mixins
export default class Columns {
  static observedAttributes = ['position', 'size', 'justify'];

  constructor(data) {
    this.element = data.target;

    const { currentAttributes } = collectAttributes(
      data.componentName,
      data.rawClasses,
      [],
      Columns.observedAttributes,
      this.element,
    );

    Object.keys(currentAttributes).forEach((key) => {
      this.element.setAttribute(key, currentAttributes[key]);
    });

    this.position = parseInt(this.getAttribute('position'), 10);
    this.size = this.getAttribute('size');
    this.justify = this.getAttribute('justify') || 'stretch';
    this.calculateGridTemplateColumns();
  }

  calculateGridTemplateColumns() {
    if (this.justify) {
      this.element.style.justifyContent = this.justify;
    }
    if (this.position) {
      const parent = this.element.parentElement;
      const children = Array.from(parent.children);
      parent.classList.add('raqn-grid');
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
        const prio = children.indexOf(this.element) + 1;
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
      this.element.style.gridColumn = this.position;
      this.element.style.gridRow = 1;
    }
  }

  getAttribute(name) {
    return (
      this.element.getAttribute(name) ||
      this.element.getAttribute(`data-${name}`)
    );
  }
}
