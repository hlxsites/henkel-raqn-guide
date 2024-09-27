import { generateDom, manipulation, renderVirtualDom } from './render/dom.js';

const start = performance.now();
// extract all the nodes from the body
window.raqnVirtualDom = manipulation(generateDom(document.body.childNodes));
// clear the body
document.body.innerHTML = '';
// append the nodes to the body after manipulation
document.body.append(...renderVirtualDom(window.raqnVirtualDom));

// callback to loadModules
await Promise.all(window.inicialization).then(() => {
  const end = performance.now();
  console.log('All modules loaded initialized', end - start);
});
