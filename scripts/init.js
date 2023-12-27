import ComponentLoader from './component-loader.js';
import { config, debounce } from './libs.js';

export function retriveDataFrom(blocks) {
  return blocks.map((block) => {
    let el = block;
    const tagName = el.tagName.toLowerCase();
    let name = tagName;
    if (!config.elementBlocks.includes(tagName)) {
      [name] = Array.from(el.classList);
    } else {
      el = document.createElement('div');
      block.append(el);
    }
    return {
      name,
      el,
    };
  });
}

export async function init(node = document) {
  let blocks = Array.from(node.querySelectorAll('[class]:not([class^=raqn]'));

  if (node === document) {
    const header = node.querySelector('header');
    const footer = node.querySelector('footer');
    blocks = [header, ...blocks, footer];
  }

  const data = retriveDataFrom(blocks);
  const prio = data.slice(0, 2);
  const rest = data.slice(2);
  Promise.all(
    prio.map(({ name, el }) => {
      const loader = new ComponentLoader(name, el);
      return loader.decorate();
    }),
  );
  setTimeout(() => {
    Promise.all(
      rest.map(({ name, el }) => {
        const loader = new ComponentLoader(name, el);
        return loader.decorate();
      }),
    );
  });

  window.addEventListener(
    'resize',
    debounce(() => {
      window.location.reload();
    }, 300),
  );
}

init();
