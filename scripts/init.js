import ComponentLoader from './component-loader.js';
import { config, debounce, eagerImage, getBreakPoint } from './libs.js';

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

function lcpPriority() {
  const lcp = document.querySelector('meta[name="lcp"]');
  if (!lcp) {
    return window.raqnLCP || [];
  }
  window.raqnLCP =
    window.raqnLCP ||
    lcp
      .getAttribute('content')
      .split(',')
      .map((name) => ({ name }));
  return window.raqnLCP;
}

eagerImage(document, 2);

export async function init(node = document) {
  let blocks = Array.from(node.querySelectorAll('[class]:not([class^=raqn]'));

  if (node === document) {
    const header = node.querySelector('header');
    const footer = node.querySelector('footer');
    blocks = [header, ...blocks, footer];
  }

  const data = retriveDataFrom(blocks);
  const lcp = window.raqnLCP;
  const prio = data.slice(0, 2);
  const rest = data.slice(2);
  Promise.all([
    ...lcp.map(({ name, el }) => {
      const loader = new ComponentLoader(name, el);
      return loader.decorate();
    }),
    ...prio.map(({ name, el }) => {
      const loader = new ComponentLoader(name, el);
      return loader.decorate();
    }),
  ]);
  setTimeout(() => {
    Promise.all(
      rest.map(({ name, el }) => {
        const loader = new ComponentLoader(name, el);
        return loader.decorate();
      }),
    );
  });
  // reload on breakpoint change
  window.raqnBreakpoint = getBreakPoint();
  window.addEventListener(
    'resize',
    debounce(() => {
      // only on width changes
      if (window.raqnBreakpoint !== getBreakPoint()) {
        window.location.reload();
      }
    }, 100),
  );
}
// mechanism of retrieving lang to be used in the app
document.documentElement.lang = document.documentElement.lang || 'en';
lcpPriority();
init();
