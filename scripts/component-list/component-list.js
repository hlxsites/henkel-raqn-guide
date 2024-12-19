import { previewModule, getMeta, metaTags } from '../libs.js';
import { setPropsAndAttributes, getClassWithPrefix } from '../render/dom-utils.js';

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
 * @prop {number} queryLevel             - set te depth level after which the search for the tag will stop.
 *                                         Option to optimize the query if it's unnecessary to to query the entire virtual dom.
 * @prop {configMethod} [filterNode]     - Filter method to identify if the node is a match for the component
 * @prop {configMethod} [transform]      - Method to modify the node in place or return a new node
 *                                         if match si more complex and can not be achieve by matching against 'blockName'
 * @prop {object}   module               - webComponent module loading configuration.
 * @prop {string}   module.path          - Root relative path to the module folder.
 * @prop {boolean} [module.loadJS=true]  - Set if the component has js module to load.
 * @prop {boolean} [module.loadCSS=true] - Set if the component has css module to load.
 * @prop {number}  [module.priority]     - The order in which the modules will be loaded.
 * @prop {number}  [module.dependencies] - An array of 'blockName's for which the modules will be loaded together with the current one.
 *                                         If a dependency is breakpoint specific that should be handled in the component
 *                                         using 'loadAndDefine(componentList[blockName])'
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
    metaHeader: getMeta(metaTags.header.metaName),
    filterNode(node) {
      if (['header', this.tag].includes(node.tag)) {
        // if the header is disabled remove it
        if (!this.metaHeader) return node.remove() || false;
        return true;
      }
      return false;
    },
    module: {
      path: '/blocks/header/header',
      priority: 1,
      dependencies: ['navigation', 'grid', 'grid-item'],
    },
  },
  footer: {
    tag: 'raqn-footer',
    method: 'append',
    queryLevel: 1,
    metaFooter: getMeta(metaTags.footer.metaName),
    filterNode(node) {
      if (['footer', this.tag].includes(node.tag)) {
        // if the footer is disabled remove it
        if (!this.metaFooter) return node.remove() || false;
        return true;
      }
      return false;
    },
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

      // Handle sections with multiple grids
      const sectionGrids = node.queryAll((n) => n.hasClass('grid'), { queryLevel: 1 });
      if (sectionGrids.length > 1) {
        if (forPreviewList) {
          forPreviewList.section.transform(node);
        } else {
          node.remove();
        }
        return;
      }

      // Set options from section metadata to section.
      const metaBlock = 'section-metadata';
      const [sectionMetaData] = node.queryAll((n) => n.hasClass(metaBlock));
      if (sectionMetaData) {
        node.class = [...sectionMetaData.class.filter((c) => c !== metaBlock)];
        setPropsAndAttributes(node);
        sectionMetaData.remove();
      }
    },
  },
  navigation: {
    tag: 'raqn-navigation',
    method: 'replace',
    module: {
      path: '/blocks/navigation/navigation',
      priority: 1,
      dependencies: ['icon'],
    },
  },
  'page-navigation': {
    tag: 'raqn-page-navigation',
    method: 'replace',
    module: {
      path: '/blocks/page-navigation/page-navigation',
      priority: 2,
    },
  },
  icon: {
    tag: 'raqn-icon',
    module: {
      path: '/blocks/icon/icon',
      priority: 1,
    },
    transform(node) {
      node.tag = this.tag;
      node.attributes['data-icon'] = getClassWithPrefix(node, 'icon-');
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
      dependencies: ['icon'],
    },
  },
  button: {
    tag: 'raqn-button',
    filterNode(node) {
      if (node.tag === 'p' && node.hasOnlyChild('a')) return true;
      return false;
    },
    transform(node) {
      node.tag = this.tag;

      const [textNode] = node.firstChild.queryAll((n) => n.tag === 'textNode', { queryLevel: 2 });
      const [ariaLabel] = node.firstChild.queryAll(
        (n) => n.tag === 'strong' && [n.nextSibling?.tag, n.previousSibling?.tag].includes('raqn-icon'),
        { queryLevel: 1 },
      );
      if (!ariaLabel && textNode) {
        textNode.tag = 'span';
      } else if (ariaLabel && textNode) {
        node.firstChild.attributes['aria-label'] = textNode.text;
        ariaLabel.remove();
      }
    },
    module: {
      path: '/blocks/button/button',
      priority: 0,
    },
  },
  'popup-trigger': {
    tag: 'raqn-popup-trigger',
    method: 'replaceWith',
    popupHash: '#popup-trigger',
    closeHash: '#popup-close',
    filterNode(node) {
      if (node.tag === 'a') {
        if (node.parentNode.tag === 'raqn-button') {
          const { href } = node.attributes;
          const [, hash] = href.split(/(?=#)/g);
          if ([this.popupHash, this.closeHash].some((item) => hash?.startsWith(item))) {
            return true;
          }
        }
      }
      return false;
    },
    transform(node) {
      let { href } = node.attributes;
      const [, hash] = href.split(/(?=#)/g);
      href = hash.startsWith(this.closeHash) ? this.closeHash : href;
      node.tag = 'button';
      node.attributes['aria-expanded'] = 'false';
      node.attributes['aria-haspopup'] = 'false';
      delete node.attributes.href;

      return [
        {
          tag: this.tag,
          attributes: {
            'data-action': href,
          },
          children: [node],
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
  columns: {
    tag: 'raqn-columns',
    // method: 'replace',
    transform(node) {
      node.tag = this.tag;
      setPropsAndAttributes(node);
      node.addClass('raqn-grid');
      [...node.children].forEach((n) => n.unWrap());

      node.children.forEach((n) => n.addClass('raqn-grid-item'));
    },
    module: {
      path: '/blocks/columns/columns',
      loadCSS: false,
      dependencies: ['grid', 'grid-item'],
    },
  },
  grid: {
    tag: 'raqn-grid',
    method: 'replace',
    module: {
      path: '/blocks/grid/grid',
      priority: 0,
      dependencies: ['grid-item'],
    },
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
  swaggeruinavigation: {
    tag: 'raqn-swaggerui-navigation',
    method: 'replace',
    module: {
      path: '/blocks/swaggeruinavigation/swaggeruinavigation',
      priority: 2,
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
