import { generateDom, manipulation, renderVirtualDom } from './render/dom.js';

window.raqnVirtualDom = manipulation(generateDom(document.body.childNodes));
document.body.innerHTML = '';
document.body.append(...renderVirtualDom(window.raqnVirtualDom));

await Promise.allSettled(window.inicialization).finally(() => {
  console.log('All components loaded');
});
