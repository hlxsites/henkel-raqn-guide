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
  const eagerImages = document.querySelector('meta[name="lcp"]');
  if (eagerImages) {
    const length = parseInt(eagerImages.getAttribute('content'), 10);
    eagerImage(document, length);
  }

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
  const start = ({ name, el }) => {
    const loader = new ComponentLoader(name, el);
    return loader.decorate();
  };
  Promise.all([
    ...lcp.map(({ name, el }) => start({ name, el })),
    ...prio.map(({ name, el }) => start({ name, el })),
  ]);
  setTimeout(() => {
    Promise.all(
      rest.map(({ name, el }) => setTimeout(() => start({ name, el }))),
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
