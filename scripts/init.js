import ComponentLoader from './component-loader.js';
import ComponentMixin from './component-mixin.js';
import {
  config,
  debounce,
  eagerImage,
  getBreakPoint,
  getMeta,
} from './libs.js';

function getInfo(block) {
  const el = block;
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
  return loader.start();
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
  return lcpMeta
    ? lcpMeta.split(',').map((name) => ({ name: name.trim() }))
    : [];
}

function includesInfo(infos, search) {
  return infos.find(({ name }) => name === search);
}

async function init() {
  const base = document.createElement('base');
  base.href = `${window.location.origin}/${getMeta('basepath') || ''}`;
  document.head.appendChild(base);

  ComponentMixin.getMixins();

  // mechanism of retrieving lang to be used in the app
  document.documentElement.lang = document.documentElement.lang || 'en';

  initEagerImages();

  const blocks = [
    document.body.querySelector(config.semanticBlocks[0]),
    ...document.querySelectorAll('[class]:not([class^=style]'),
    document.body.querySelector(config.semanticBlocks.slice(1).join(',')),
  ];

  const data = getInfos(blocks);
  const lcp = getLcp().map(({ name }) => includesInfo(data, name) || { name });
  const delay = window.raqnLCPDelay || [];
  const lazy = data.filter(
    ({ name }) => !includesInfo(lcp, name) && !includesInfo(delay, name),
  );

  // start with lcp
  Promise.all(lcp.map(({ name, el }) => start({ name, el }))).then(() => {
    document.body.style.display = 'unset';
  });
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
