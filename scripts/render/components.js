// eslint-disable-next-line import/prefer-default-export

import { loadModule } from '../libs.js';

window.loadedComponents = window.loadedComponents || {};
window.inicialization = window.inicialization || [];
window.raqnComponents = window.raqnComponents || {};
const { loadedComponents } = window;

export const componentList = {
  grid: {
    tag: 'raqn-grid',
    script: '/blocks/grid/grid',
    priority: 2,
  },
  picture: {
    tag: 'raqn-image',
    script: '/blocks/image/image',
    priority: 0,
    transform: (node) => {
      const nextSibling = { ...node.nextSibling };
      if (nextSibling && nextSibling.tag === 'a') {
        const { aria } = nextSibling.children[0].text;
        node.attributes.push({ name: 'aria-label', value: aria });
        nextSibling.children = [node];
        node.parentNode.children.splice(nextSibling.indexInParent, 1, {
          tag: 'textNode',
          text: '',
        });
        return nextSibling;
      }
      return node;
    },
  },
  navigation: {
    tag: 'raqn-navigation',
    script: '/blocks/navigation/navigation',
    priority: 0,
    dependencies: ['accordion', 'icon'],
  },
  'grid-item': {
    tag: 'raqn-grid-item',
    script: '/blocks/grid-item/grid-item',
    priority: 2,
  },
  icon: {
    tag: 'raqn-icon',
    script: '/blocks/icon/icon',
    priority: 0,
  },
  card: {
    tag: 'raqn-card',
    script: '/blocks/card/card',
    priority: 2,
  },
  header: {
    tag: 'raqn-header',
    script: '/blocks/header/header',
    priority: 1,
  },
  footer: {
    tag: 'raqn-footer',
    script: '/blocks/footer/footer',
    priority: 1,
  },
  theming: {
    tag: 'raqn-theming',
    script: '/blocks/theming/theming',
    priority: 0,
  },
  accordion: {
    tag: 'raqn-accordion',
    script: '/blocks/accordion/accordion',
    priority: 1,
  },
  a: {
    tag: 'raqn-button',
    priority: 0,
    script: '/blocks/button/button',
    transform: (node) => {
      if (
        !node.nextSibling &&
        node.parentNode.tag === 'div' &&
        !['raqn-image', 'picture'].includes(node.children[0].tag)
      ) {
        const child = { ...node };
        node.tag = 'raqn-button';
        node.children = [child];
      }
      return node;
    },
  },
};

export const injectedComponents = [
  {
    tag: 'div',
    class: ['theming'],
    children: [],
    attributes: [],
  },
];

// eslint-disable-next-line prefer-destructuring

export const toWebComponent = (node) => {
  Object.keys(componentList).forEach((componentClass) => {
    if ((node.class && node.class.includes(componentClass)) || node.tag === componentClass) {
      const { dependencies } = componentList[componentClass];
      if (componentList[componentClass].transform) {
        // eslint-disable-next-line no-param-reassign
        node = componentList[componentClass].transform(node);
      } else {
        node.tag = componentList[componentClass].tag;
      }

      if (!loadedComponents[componentClass]) {
        loadedComponents[componentClass] = componentList[componentClass];
      }
      if (dependencies) {
        dependencies.forEach((dependency) => {
          if (!loadedComponents[dependency]) {
            loadedComponents[dependency] = componentList[dependency];
          }
        });
      }
    }
  });
  return node;
};

export const loadModules = (nodes) => {
  window.inicialization = Object.keys(loadedComponents)
    .sort((a, b) => {
      if (loadedComponents[a].priority > loadedComponents[b].priority) {
        return 1;
      }
      if (loadedComponents[a].priority < loadedComponents[b].priority) {
        return -1;
      }
      return 0;
    })
    .map(async (component) => {
      const { script, tag } = loadedComponents[component];
      if (window.raqnComponents[tag]) return window.raqnComponents[tag].default;
      const { js } = await loadModule(script);
      const mod = await js;
      if (mod.default.prototype instanceof HTMLElement) {
        if (!window.customElements.get(tag)) {
          window.customElements.define(tag, mod.default);
          window.raqnComponents[tag] = mod.default;
        }
      }
      return js;
    });
  return nodes;
};

export const templating = (nodes) => {
  const items = nodes.slice();
  items.unshift(...injectedComponents);
  return items;
};

export const cleanEmptyTextNodes = (node) => {
  // remove empty text nodes to avoid rendering those
  if (node.children) {
    node.children = node.children.filter((n) => {
      if (n.tag === 'textNode') {
        const text = n.text.replace(/ /g, '').replace(/\n/g, '');
        return text !== '';
      }
      return true;
    });
  }
  return node;
};

export const cleanEmptyNodes = (node) => {
  if (node.tag === 'p' && node.children.length === 1 && ['a', 'picture'].includes(node.children[0].tag)) {
    return node.children[0];
  }
  if (
    node.tag === 'div' &&
    node.class.length === 0 &&
    node.children.length === 1 &&
    node.children[0].tag !== 'textNode'
  ) {
    return node.children[0];
  }
  return node;
};
