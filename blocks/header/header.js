// import ComponentBase from '../../scripts/component-base.js';
// import { eagerImage } from '../../scripts/libs.js';

// class Header extends ComponentBase {
//   external = '/header.plain.html';

//   async processExternal(response) {
//     await super.processExternal(response);
//     eagerImage(this, 1);
//   }
// }

export default async function (block) {
  console.log('block', block);
  // await new Header(block).decorate();
}
