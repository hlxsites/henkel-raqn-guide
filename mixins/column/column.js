import ComponentMixin from '../../scripts/component-mixin.js';

export default class Column extends ComponentMixin {
  static observedAttributes = ['column-position', 'column-size', 'column-justify'];

  constructor(element) {
    super(element);
    this.position = parseInt(this.getAttribute('column-position'), 10);
    this.size = this.getAttribute('column-size');
    this.justify = this.getAttribute('column-justify') || 'stretch';
  }
  
  start() {
    const content = this.element.querySelectorAll('div > div');
    // clean up dom structure (div div div div div div) and save the content
    this.contentChildren = Array.from(content).map((child) => {
      const { children } = child;
      const parent = child.parentNode;
      if (children.length > 0) {
        child.replaceWith(...children);
      }
      return parent;
    });
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
}
