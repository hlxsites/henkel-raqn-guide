import ComponentLoader from './component-loader.js';
import { config, debounce, eagerImage, getBreakPoint, getMeta } from './libs.js';

function getInfo(block) {
  let el = block;
  const tagName = el.tagName.toLowerCase();
  let name = tagName;
  if (!config.semanticBlocks.includes(tagName)) {
    [name] = Array.from(el.classList);
  }
  return {
    name,
    el,
  };
}

function getInfos(blocks) {
  return blocks.map((block) => getInfo(block));
}

export async function start({ name, el }) {
  const loader = new ComponentLoader(name, el);
  return loader.decorate();
}

export async function startBlock(block) {
  return start(getInfo(block));
}

function initEagerImages() {
  const eagerImages = getMeta('eager-images');
  if (eagerImages) {
    const length = parseInt(eagerImages, 10);
    eagerImage(document.body, length);
  }
}

function getLcp() {
  const lcpMeta = getMeta('lcp');
  return lcpMeta ? lcpMeta.split(',').map((name) => ({ name })) : [];
}

async function init() {
  // mechanism of retrieving lang to be used in the app
  document.documentElement.lang = document.documentElement.lang || 'en';

  initEagerImages();

  const blocks = [
    ...document.head.querySelectorAll('style[class]'), 
    document.body.querySelector('header'), 
    ...document.body.querySelectorAll('main > div > div'), 
    document.body.querySelector('footer'),
  ];

  const lcp = getLcp();
  const delay = window.raqnLCPDelay || [];
  const data = getInfos(blocks);
  const priority = data.filter(({ name }) => lcp.includes(name));
  const lazy = data.filter(
    ({ name }) => !lcp.includes(name) && !delay.includes(name)
  );

  // start with lcp and priority
  lcp.map(({ name, el }) => start({ name, el })),
  priority.map(({ name, el }) => start({ name, el })),
  // timeout for the rest to proper prioritize in case of stalled loading
  lazy.map(({ name, el }) => setTimeout(() => start({ name, el })));

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

init();
