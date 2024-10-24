import { previewModule } from '../libs.js';

const forPreviewList = await previewModule(import.meta, 'componentList');

/**
 * @typedef blockName                    - The EDS bock name which will match a css class or the html tag of an element
 *                                         to identify it a component.
 *                                         For more complex cases componentConfig.filterNode method can be used.
 * @type {string}
 */
/**
 * @typedef configMethod                 - the EDS bock name which will match a css class or the html tag of an element
 * @type {function}
 * @param {object} node                  - virtualDom node nodeProxy
 */
/**
 * @typedef componentConfig
 * @type {object}
 * @prop {string} tag                    - webComponent tag.
 * @prop {string} method                 - The virtualDom mode mutation method found in /scripts/render/dom/dom.js/nodeProxy
 *                                         e.g." 'append', 'replaceWith' etc.
 *                                         Or the special value 'replace' which does a simple tag value change.
 * @prop {string} method                 - The virtualDom mutation method found in /scripts/render/dom/dom.js/nodeProxy. e.g." 'append', 'replaceWith'
 * @prop {object} module                 - webComponent module loading configuration.
 * @prop {string} module.path            - Root relative path to the module folder.
 * @prop {boolean} [module.loadJS=true]  - Set if the component has js module to load.
 * @prop {boolean} [module.loadCSS=true] - Set if the component has css module to load.
 * @prop {number} [module.priority]      - The order in which the modules will be loaded.
 * @prop {configMethod} [filterNode]     - Filter method to identify if the node is a match for the component
 *                                         if match si more complex and can not be achieve by matching against 'blockName'
 * @prop {configMethod} [transform]      - Method to modify the node in place or return a new node
 */
/**
 * @type {Object.<blockName, componentConfig>}
 */
export const componentList = {
  theming: {
    tag: 'raqn-theming',
    method: 'replace',
    module: {
      path: '/blocks/theming/theming',
      priority: 1,
    },
  },
  breadcrumbs: {
    tag: 'raqn-breadcrumbs',
    method: 'replace',
    module: {
      path: '/blocks/breadcrumbs/breadcrumbs',
      priority: 1,
    },
  },
  header: {
    tag: 'raqn-header',
    method: 'append',
    queryLevel: 1,
    module: { path: '/blocks/header/header' },
    dependencies: ['navigation', 'grid', 'grid-item'],
    priority: 1,
  },
  footer: {
    tag: 'raqn-footer',
    method: 'append',
    queryLevel: 1,
    module: {
      path: '/blocks/footer/footer',
      priority: 3,
    },
  },
  section: {
    tag: 'raqn-section',
    filterNode(node) {
      if (node.tag === 'div' && ['main', 'virtualDom'].includes(node.parentNode.tag)) return true;
      return false;
    },
    transform(node) {
      node.tag = this.tag;

      // Set options from section metadata to section.
      const metaBlock = 'section-metadata';
      const [sectionMetaData] = node.queryAll((n) => n.hasClass(metaBlock));
      if (sectionMetaData) {
        node.class = [...sectionMetaData.class.filter((c) => c !== metaBlock)];
        sectionMetaData.remove();
      }

      // Handle sections with multiple grids
      const sectionGrids = node.queryAll((n) => n.hasClass('grid'), { queryLevel: 1 });
      if (sectionGrids.length > 1) {
        if (forPreviewList) {
          forPreviewList.section.transform(node);
        } else {
          node.remove();
        }
      }
    },
  },
  navigation: {
    tag: 'raqn-navigation',
    method: 'replace',
    module: {
      path: '/blocks/navigation/navigation',
      priority: 1,
    },
    // dependencies: ['accordion', 'icon'],
  },
  icon: {
    tag: 'raqn-icon',
    method: 'replace',
    module: {
      path: '/blocks/icon/icon',
      priority: 1,
    },
  },
  picture: {
    tag: 'raqn-image',
    filterNode(node) {
      if (node.tag === 'p' && node.hasOnlyChild('picture')) return true;
      return false;
    },
    transform(node) {
      node.tag = this.tag;

      // Generate linked images based on html structure convention
      const { nextSibling, firstChild: picture } = node;
      if (nextSibling?.tag === 'p' && nextSibling.firstChild?.tag === 'em') {
        const anchor = nextSibling?.firstChild?.firstChild;

        if (anchor?.tag === 'a') {
          anchor.attributes['aria-label'] = anchor.firstChild.text;
          anchor.firstChild.remove();
          picture.wrapWith(anchor);
          nextSibling.remove();
        }
      }
    },
  },
  card: {
    tag: 'raqn-card',
    method: 'replace',
    module: {
      path: '/blocks/card/card',
      priority: 2,
    },
  },
  accordion: {
    tag: 'raqn-accordion',
    method: 'replace',
    module: {
      path: '/blocks/accordion/accordion',
      priority: 2,
    },
  },
  button: {
    tag: 'raqn-button',
    method: 'replace',
    filterNode(node) {
      if (node.tag === 'p' && node.hasOnlyChild('a')) return true;
      return false;
    },
    module: {
      path: '/blocks/button/button',
      priority: 0,
    },
  },
  'popup-trigger': {
    tag: 'raqn-popup-trigger',
    method: 'replaceWith',
    filterNode(node) {
      if (node.tag === 'a') {
        if (node.parentNode.tag === 'raqn-button') {
          const { href } = node.attributes;
          const hash = href.substring(href.indexOf('#'));
          if (['#popup-trigger', '#popup-close'].includes(hash)) return true;
        }
      }
      return false;
    },
    transform(node) {
      const { href } = node.attributes;
      const hash = href.substring(href.indexOf('#'));

      return [
        {
          tag: 'raqn-popup-trigger',
          attributes: {
            'data-action': hash,
          },
          children: [
            {
              tag: 'button',
              attributes: {
                'aria-expanded': 'false',
                'aria-haspopup': 'true',
                type: 'button',
              },
              children: [...node.children],
            },
          ],
        },
        { processChildren: true },
      ];
    },
    module: {
      path: '/blocks/popup-trigger/popup-trigger',
      loadCSS: false,
      priority: 3,
    },
  },
  popup: {
    tag: 'raqn-popup',
    method: 'replace',
    module: {
      path: '/blocks/popup/popup',
      priority: 4,
    },
  },
  grid: {
    tag: 'raqn-grid',
    method: 'replace',
    module: {
      path: '/blocks/grid/grid',
      priority: 0,
    },
    dependencies: ['grid-item'],
  },
  'grid-item': {
    method: 'replace',
    tag: 'raqn-grid-item',
    module: {
      path: '/blocks/grid-item/grid-item',
      priority: 0,
    },
  },
  'developers-content': {
    tag: 'raqn-developers-content',
    method: 'replace',
    module: {
      path: '/blocks/developers-content/developers-content',
      priority: 4,
    },
  },
  'sidekick-tools-palette': {
    tag: 'raqn-sidekick-tools-palette',
    method: 'replace',
    module: {
      path: '/blocks/sidekick-tools-palette/sidekick-tools-palette',
      priority: 4,
    },
  },
  swaggerui: {
    tag: 'raqn-swaggerui',
    method: 'replace',
    module: {
      path: '/blocks/swaggerui/swaggerui',
      priority: 2,
    },
  },
  mermaid: {
    tag: 'raqn-mermaid',
    method: 'replace',
    module: {
      path: '/blocks/mermaid/mermaid',
      loadCSS: false,
      priority: 2,
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
