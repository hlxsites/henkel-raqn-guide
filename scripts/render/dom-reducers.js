// eslint-disable-next-line import/prefer-default-export
import { deepMerge, getMeta, loadAndDefine, previewModule } from '../libs.js';
import { tplPlaceholderCheck, queryTemplatePlaceholders, setPropsAndAttributes } from './dom-utils.js';
import { componentList, injectedComponents } from '../component-list/component-list.js';
import { createNode } from './dom.js';

window.raqnComponentsList ??= {};
window.raqnOnComponentsLoaded ??= [];
window.raqnComponents ??= {};
// export those variables to be used in other modules
export const { raqnComponentsList } = window;
export const { raqnComponents } = window;
export const { raqnOnComponentsLoaded } = window;

export const forPreviewManipulation = async (manipulation) => (await previewModule(import.meta, manipulation)) || {};
export const { noContentPlaceholder, duplicatedPlaceholder } = await forPreviewManipulation();

export const eagerImage = (node) => {
  if (!window.raqnEagerImages) {
    const eager = getMeta('eager-images');
    window.raqnEagerImages = parseInt(eager, 10) || 0;
  }
  if (node.tag === 'picture' && window.raqnEagerImages > 0) {
    const img = node.children.find((child) => child.tag === 'img');
    if (img) {
      const { width, height } = img.attributes;
      img.attributes.style = `aspect-ratio: ${width} / ${height};`;
      img.attributes.loading = 'eager';
      window.raqnEagerImages -= 1;
    }
  }
};

export const prepareGrid = (node) => {
  if (node.children && node.children.length > 0) {
    const grids = node.children.filter((child) => child.tag === 'raqn-grid');
    const gridItems = node.children.filter((child) => child.tag === 'raqn-grid-item');

    grids.map((grid, i) => {
      const initial = node.children.indexOf(grid);
      const nextGridIndex = grids[i + 1] ? node.children.indexOf(grids[i + 1]) : node.children.length;
      gridItems.map((item) => {
        const itemIndex = node.children.indexOf(item);
        // get elements between grid and item and insert into grid
        if (itemIndex > initial && itemIndex < nextGridIndex) {
          const children = node.children.splice(initial + 1, itemIndex - initial);
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

const addToLoadComponents = (blockSelector, config) => {
  const { dependencies } = config.module || {};

  const toLoad = [blockSelector, ...(dependencies || [])];

  toLoad.forEach((load) => {
    if (!raqnComponentsList[load]) {
      raqnComponentsList[load] = componentList[load];
    }
  });
};

export const toWebComponent = (virtualDom) => {
  const componentConfig = deepMerge({}, componentList);
  const componentConfigList = Object.entries(componentConfig);
  // Simple and fast in place tag replacement
  // recursive((node) => {
  componentConfigList.forEach(([blockName, config]) => {
    const { method = 'replace', tag, filterNode } = config;
    if (virtualDom.tag === blockName || virtualDom?.class?.includes?.(blockName) || filterNode?.bind(config)(virtualDom)) {
      const transformNode = config?.transform?.bind(config)(virtualDom) || { tag };
      virtualDom[method](transformNode);
      setPropsAndAttributes(virtualDom);
      addToLoadComponents(blockName, config);
    }
  });
};

// load modules in order of priority
export const loadModules = (nodes, extra = {}) => {
  const modules = { ...raqnComponentsList, ...extra };
  window.raqnOnComponentsLoaded = Object.keys(modules)
    .filter((component) => modules[component]?.module?.path)
    .sort((a, b) => modules[a].module.priority - modules[b].module.priority)
    .forEach((component) => {
      const {
        module: { priority },
        tag,
      } = modules[component];
      if (window.raqnComponents[tag]) return window.raqnComponents[tag];
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            const { module } = await loadAndDefine(modules[component]);
            
            resolve(module);
          } catch (error) {
            reject(error);
          }
        }, priority || 0);
      });
    });
  return nodes;
};

// Just inject components that are not in the list
export const inject = (nodes) => {
  const injects = injectedComponents.map((component) => createNode(component));
  nodes.children = [...injects, ...nodes.children];
};

// clear empty text nodes or nodes with only text breaklines and spaces
export const cleanEmptyTextNodes = (node) => {
  if (node.tag === 'textNode') {
    const text = node.text.replace(/ /g, '').replace(/\n/g, '');
    if (text === '') node.remove();
  }
};

// clear empty nodes that are not necessary to avoid rendering
export const cleanBrNodes = (node) => {
  if (node.tag === 'br') {
    node.remove();
  }
};

export const cleanEmptyNodes = (node) => {
  cleanEmptyTextNodes(node);
  cleanBrNodes(node);
};

// in some cases when the placeholder is the only content in a block row the text is not placed in a <p>
// wrap the placeholder in a <p> to normalize placeholder identification.
export const buildTplPlaceholder = (node) => {
  if (!tplPlaceholderCheck('p', node)) return;
  const child = createNode({ tag: 'p'});
  node.wrapWith(child);
};

export const replaceTemplatePlaceholders = (tplVirtualDom) => {
  const pageVirtualDom = window.raqnVirtualDom;
  const { placeholders, placeholdersNodes } = queryTemplatePlaceholders(tplVirtualDom);
  duplicatedPlaceholder?.(placeholdersNodes, placeholders);
  placeholdersNodes.forEach((node, i) => {
    const placeholder = placeholders[i];
    const placeholderContent = pageVirtualDom.queryAll(
      (n) => {
        if (n.tag !== 'raqn-section') return false;

        if (n.hasClass(placeholder) === true) return true;
        // console.log('n', n.tag, n.class, n.hasClass(placeholder));
        // // if main content special placeholder is defined in the template any section without a placeholder will be added to the main content.
        if (placeholder === 'tpl-content-auto-main' && n.class.every((ph) => !placeholders.includes(ph))) return true;
        return false;
      },
    );
    if (placeholderContent.length) {
      node.tag = 'raqn-section';
      node.children = placeholderContent;
    }
    else if (noContentPlaceholder) {
      noContentPlaceholder(node);
    } else node.remove();
  });
  const [main] = pageVirtualDom.queryAll((n) => n.tag === 'main');
  const section = createNode({ tag: 'raqn-section'});
  section.children = tplVirtualDom.firstChild.children;
  main.children = [section];
};
