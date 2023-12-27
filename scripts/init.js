import ComponentLoader from './component-loader.js';
import { config, debounce } from './libs.js';

export function retriveDataFrom(blocks) {
  return blocks.map((block) => {
    let element = block;
    const tagName = element.tagName.toLowerCase();
    let blockName = tagName;
    if (!config.elementBlocks.includes(tagName)) {
      [blockName] = Array.from(element.classList);
    } else {
      element = document.createElement('div');
      block.append(element);
    }
    return {
      blockName,
      element,
    };
  });
}

export async function init(element = document) {
  let blocks = Array.from(
    element.querySelectorAll('[class]:not([class^=raqn]'),
  );

  if (element === document) {
    const header = element.querySelector('header');
    const footer = element.querySelector('footer');
    blocks = [header, ...blocks, footer];
  }

  const data = retriveDataFrom(blocks);
  const prio = data.slice(0, 2);
  const rest = data.slice(2);
  Promise.all(
    prio.map(({ blockName, el }) => {
      const loader = new ComponentLoader(blockName, el);
      return loader.decorate();
    }),
  );
  setTimeout(() => {
    Promise.all(
      rest.map(({ blockName, el }) => {
        const loader = new ComponentLoader(blockName, el);
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
