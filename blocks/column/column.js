// import ComponentBase from '../../scripts/component-base.js';

// export default class Column extends ComponentBase {
//   static observedAttributes() {
//     return ['position', 'size'];
//   }

//   connected() {
//     this.calculateGridTemplateColumns();
//   }

//   calculateGridTemplateColumns() {
//     this.position = parseInt(this.getAttribute('position'), 10);
//     this.size = this.getAttribute('size');
//     this.justify = this.getAttribute('justify') || 'stretch';
//     if (this.justify) {
//       this.style.justifyContent = this.justify;
//     }
//     if (this.position) {
//       const parent = this.parentElement;
//       const children = Array.from(parent.children);
//       this.parentElement.classList.add('raqn-grid');
//       let parentGridTemplateColumns = parent.style.getPropertyValue(
//         '--grid-template-columns',
//       );
//       if (!parentGridTemplateColumns) {
//         // we have no grid template columns yet
//         parentGridTemplateColumns = children
//           .map((child, index) => {
//             if (this.position === index + 1) {
//               return this.size || 'auto';
//             }
//             return 'auto';
//           })
//           .join(' ');
//         // set the new grid template columns
//         parent.style.setProperty(
//           '--grid-template-columns',
//           parentGridTemplateColumns,
//         );
//       } else {
//         const { position } = this;
//         const prio = children.indexOf(this) + 1;
//         parentGridTemplateColumns = parentGridTemplateColumns
//           .split(' ')
//           .map((size, i) => {
//             // we have a non standard value for this position
//             const hasValue = size !== 'auto';
//             // we are at the position
//             const isPosition = i + 1 === position;
//             // we are at a position before the prio
//             const isBeforePrio = i + 1 <= prio;
//             // we have a non standard value for this position and we are at the position
//             if (!hasValue && isPosition) {
//               return this.size || 'auto';
//             }
//             // we have a non standard value for this position and we are at a position before the prio
//             if (hasValue && isPosition && isBeforePrio) {
//               return this.size || size;
//             }
//             return size;
//           })
//           .join(' ');
//         // set the new grid template columns
//         parent.style.setProperty(
//           '--grid-template-columns',
//           parentGridTemplateColumns,
//         );
//       }
//       this.style.gridColumn = this.position;
//       this.style.gridRow = 1;
//     }
//   }
// }

export default async function (block) {
  console.log('block', block);
  // await new Header(block).decorate();
}
