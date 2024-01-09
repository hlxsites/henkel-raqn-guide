import ComponentLoader from './component-loader.js';
import { config, debounce, eagerImage, getBreakPoint } from './libs.js';

export function getInfos(blocks) {
  return blocks.map((block) => {
    let el = block;
    const tagName = el.tagName.toLowerCase();
    let name = tagName;
    if (!config.elementBlocks.includes(tagName)) {
      [name] = Array.from(el.classList);
    } else {
      // allow original way of defining blocks
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
  const eagerImages = document.querySelector('meta[name="eager"]');
  if (eagerImages) {
    const length = parseInt(eagerImages.content, 10);
    eagerImage(document.body, length);
  }

  const lcp = document.querySelector('meta[name="lcp"]');
  if (!lcp) {
    return window.raqnLCP || [];
  }
  window.raqnLCP =
    window.raqnLCP || lcp.content.split(',').map((name) => ({ name }));
  return window.raqnLCP;
}

export async function init(node = document) {
  let blocks = Array.from(node.querySelectorAll('[class]:not([class^=style]'));

  if (node === document) {
    const header = node.querySelector('header');
    const footer = node.querySelector('footer');
    blocks = [header, ...blocks, footer];
  }

  const data = getInfos(blocks);
  const lcp = window.raqnLCP;
  const priority = data.filter(({ name }) => lcp.includes(name));
  const rest = data.filter(({ name }) => !lcp.includes(name));
  const start = ({ name, el }) => {
    const loader = new ComponentLoader(name, el);
    return loader.decorate();
  };

  // start with lcp and priority
  Promise.all([
    ...lcp.map(({ name, el }) => start({ name, el })),
    ...priority.map(({ name, el }) => start({ name, el })),
  ]);

  // timeout for the rest to proper prioritize in case of stalled loading
  rest.map(({ name, el }) => setTimeout(() => start({ name, el })), 100);

  // reload on breakpoint change to reset params and variables
  window.raqnBreakpoint = getBreakPoint();
  window.addEventListener(
    'resize',
    debounce(() => {
      // only on width / breakpoint changes
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
