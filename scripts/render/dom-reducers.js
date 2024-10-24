// eslint-disable-next-line import/prefer-default-export
import { deepMerge, getMeta, loadAndDefine, previewModule } from '../libs.js';
import { recursive, tplPlaceholderCheck, queryTemplatePlaceholders } from './dom-utils.js';
import { componentList, injectedComponents } from '../component-list/component-list.js';

window.loadedComponents = window.loadedComponents || {};
window.initialization = window.initialization || [];
window.raqnComponents = window.raqnComponents || {};
const { loadedComponents } = window;

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
  if (node.children && node.children.length > 0 && node.tag === 'raqn-section') {
    const [grid, ...gridItems] = node.queryAll((n) => ['raqn-grid', 'raqn-grid-item'].includes(n.tag), {
      queryLevel: 1,
    });

    if (!grid) return;
    gridItems.forEach((item) => {
      const currentChildren = [...node.children];
      const initial = currentChildren.indexOf(grid);
      const itemIndex = currentChildren.indexOf(item);
      const gridItemChildren = currentChildren.splice(initial + 1, itemIndex - initial - 1);
      item.append(...gridItemChildren);
      grid.append(item);
    });
  }
};

const addToLoadComponents = (blockSelector, config) => {
  const { dependencies } = config;

  const toLoad = [blockSelector, ...(dependencies || [])];

  toLoad.forEach((load) => {
    if (!loadedComponents[load]) {
      loadedComponents[load] = componentList[load];
    }
  });
};

export const toWebComponent = (virtualDom) => {
  const componentConfig = deepMerge({}, componentList);
  const componentConfigList = Object.entries(componentConfig);

  const { replaceBlocks, queryBlocks } = componentConfigList.reduce(
    (acc, item) => {
      const [, config] = item;
      if (config.method === 'replace') {
        acc.replaceBlocks.push(item);
      } else acc.queryBlocks.push(item);
      return acc;
    },
    { replaceBlocks: [], queryBlocks: [] },
  );

  // Simple and fast in place tag replacement
  recursive((node) => {
    replaceBlocks.forEach(([blockSelector, config]) => {
      if (node?.class?.includes?.(blockSelector) || config.filterNode?.(node)) {
        node.tag = config.tag;
        addToLoadComponents(blockSelector, config);
      }
    });
  })(virtualDom);

  // More complex transformation need to be done in order based on a separate query for each component.
  queryBlocks.forEach(([blockSelector, config]) => {
    const filter =
      config.filterNode || ((node) => node?.class?.includes?.(blockSelector) || node.tag === blockSelector);
    const nodes = virtualDom.queryAll(filter, { queryLevel: config.queryLevel });

    nodes.forEach((node) => {
      const defaultNode = [{ tag: config.tag }];
      const hasTransform = typeof config.transform === 'function';
      const transformNode = config.transform?.(node);
      if ((!hasTransform || (hasTransform && transformNode)) && config.method) {
        node[config.method](...(transformNode || defaultNode));
      }
      addToLoadComponents(blockSelector, config);
    });
  });
};

// load modules in order of priority
export const loadModules = (nodes, extra = {}) => {
  const modules = { ...loadedComponents, ...extra };
  window.initialization = Object.keys(modules)
    .sort((a, b) => modules[a].priority - modules[b].priority)
    .flatMap((component) => {
      const { tag, priority } = modules[component];
      if (window.raqnComponents[tag]) return window.raqnComponents[tag].default;
      if (!modules[component]?.module?.path) return [];
      return new Promise((resolve) => {
        setTimeout(async () => {
          resolve(await loadAndDefine(modules[component]));
        }, priority || 0);
      });
    });
  return nodes;
};

// Just inject components that are not in the list
export const inject = (nodes) => {
  const [header] = nodes.children;
  header.before(...injectedComponents);
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
  if (!tplPlaceholderCheck('div', node)) return;

  node.append(
    {
      tag: 'p',
      children: [node.firstChild],
    },
    { processChildren: true },
  );
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
        if (n.hasClass(placeholder)) return true;
        // if main content special placeholder is defined in the template any section without a placeholder will be added to the main content.
        if (placeholder === 'tpl-content-auto-main' && n.class.every((ph) => !placeholders.includes(ph))) return true;

        return false;
      },
      { queryLevel: 4 },
    );

    if (placeholderContent.length) node.replaceWith(...placeholderContent);
    else if (noContentPlaceholder) {
      noContentPlaceholder(node);
    } else node.remove();
  });
  const [main] = pageVirtualDom.queryAll((n) => n.tag === 'main', { queryLevel: 1 });
  main.prepend(...tplVirtualDom.children);
};
