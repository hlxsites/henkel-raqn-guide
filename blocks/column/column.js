import { ComponentBase } from "../../scripts/component-base.js";

export default class Column extends ComponentBase {

  connected() {
    this.calculateGridTemplateColumns();
  }

  calculateGridTemplateColumns() {
    this.position = this.getAttribute('position');
    this.size = this.getAttribute('size');
    if (this.position) {
        const parent = this.parentElement;
        const children = Array.from(parent.children);
        this.parentElement.classList.add('raqn-grid');
        let parentGridTemplateColumns = parent.style.getPropertyValue('--grid-template-columns');
        if (!parentGridTemplateColumns) {
            console.log(children);
            parentGridTemplateColumns = children.map((child,index) => {
                console.log(child, index, this.position);
                if (this.position == index + 1) {
                    return this.size || 'auto';
                }
                return 'auto';
            }).join(' ');
            console.log(parentGridTemplateColumns);
            parent.style.setProperty('--grid-template-columns', parentGridTemplateColumns);
        } else {
            const position = this.position
            const prio = children.indexOf(this) + 1;
            parentGridTemplateColumns = parentGridTemplateColumns.split(' ').map((size, i) => {
                // we have a non standard value for this position
                const hasValue = size !== 'auto';
                // we are at the position
                const isPosition = (i + 1) == position;
                // we are at a position before the prio
                const isBeforePrio = (i + 1) <= prio;
                // we have a non standard value for this position and we are at the position
                if (!hasValue && isPosition) {
                    console.log('At position', position,'change ',size, 'for ', this.size);
                }
                // we have a value for this position and we are at the position
                if (!hasValue && isPosition) {
                    return this.size || 'auto';
                }
                if (hasValue && isPosition && isBeforePrio) {
                    return this.size || size;
                }
                return size;
            }).join(' ');
            console.log(parentGridTemplateColumns);
            parent.style.setProperty('--grid-template-columns', parentGridTemplateColumns);
        }
        this.style.gridColumn = this.position;
        this.style.gridRow = 1;
    }
  }
}