// eslint-disable-next-line import/prefer-default-export

import { loadModule } from '../libs.js';
import { componentList, injectedComponents } from './component-list.js';

window.loadedComponents = window.loadedComponents || {};
window.inicialization = window.inicialization || [];
window.raqnComponents = window.raqnComponents || {};
const { loadedComponents } = window;

export const filterNodes = (nodes, tag, className) => {
  const filtered = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.tag === tag && (className ? node.class.includes(className) : true)) {
      node.inicialIndex = i;
      filtered.push(node);
    }
  }
  return filtered;
};

export const prepareGrid = (node) => {
  if (node.children && node.children.length > 0) {
    const grids = filterNodes(node.children, 'raqn-grid');
    const gridItems = filterNodes(node.children, 'raqn-grid-item');

    grids.map((grid, i) => {
      const inicial = node.children.indexOf(grid);
      const nextGridIndex = grids[i + 1] ? node.children.indexOf(grids[i + 1]) : node.children.length;
      gridItems.map((item) => {
        const itemIndex = node.children.indexOf(item);
        // get elements between grid and item and insert into grid
        if (itemIndex > inicial && itemIndex < nextGridIndex) {
          const children = node.children.splice(inicial + 1, itemIndex - inicial);
          const gridItem = children.pop(); // remove grid item from children
          gridItem.children = children;
          grid.children.push(gridItem);
        }
      });
      return grid;
    });
  }
  return node;
};
// Compare this snippet from scripts/render/dom.js:

export const recursive = (fn) => (nodes, level) =>
  nodes.map((node) => {
    if (node.children) {
      node.children = recursive(fn)(node.children, level + 1);
    }
    return fn(node, level);
  });

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
    .map((component) => {
      const { script, tag } = loadedComponents[component];
      if (window.raqnComponents[tag]) return window.raqnComponents[tag].default;
      return (async () => {
        const { js, css } = loadModule(script);

        const mod = await js;
        const style = await css;
        if (mod.default.prototype instanceof HTMLElement) {
          if (!window.customElements.get(tag)) {
            window.customElements.define(tag, mod.default);
            window.raqnComponents[tag] = mod.default;
          }
        }
        return { tag, mod, style };
      })();
    });
  return nodes;
};

// Just inject components that are not in the list
export const inject = (nodes) => {
  const items = nodes.slice();
  items.unshift(...injectedComponents);
  return items;
};
// clear empty text nodes or nodes with only text breaklines and spaces
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

// clear empty nodes that are not necessary to avoid rendering
export const cleanEmptyNodes = (node) => {
  if (node.tag === 'p' && node.children.length === 1 && ['a', 'picture'].includes(node.children[0].tag)) {
    return node.children[0];
  }
  if (node.tag === 'em' && node.children.length === 1 && node.children[0].tag === 'a') {
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
