import { generateDom, manipulation, renderVirtualDom } from './render/dom.js';
// extract all the nodes from the body
window.raqnVirtualDom = manipulation(generateDom(document.body.childNodes));
// clear the body
document.body.innerHTML = '';
// append the nodes to the body after manipulation
document.body.append(...renderVirtualDom(window.raqnVirtualDom));

// EG callback to loadModules
await Promise.all(window.inicialization).then(() => {
  // some after main modules loaded
});
