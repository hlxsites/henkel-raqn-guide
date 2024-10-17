import { forPreview } from '../libs.js';

const forPreviewList = await forPreview('componentList', import.meta);

/* 
list of components that will are available to be set in the dom

 [class or tag]: { => class or tag that will be replaced by the tag
    tag: string, => tag that will replace the class or tag
    script: string, => path to the script that will be loaded
    priority: number, => priority to load the script
    transform: function, => function that will transform the node
                            if function returns a node it uses the method to process the new node,
                            otherwise if nothing is returned all the transformation must be done manually 
    dependencies: [string], => list of dependencies that will be loaded before the script
}
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
      const [sectionMetaData] = node.queryAll((n) => n.class.includes(metaBlock));
      if (sectionMetaData) {
        node.class = [...sectionMetaData.class.filter((c) => c !== metaBlock)];
        sectionMetaData.remove();
      }

      // Handle sections with multiple grids
      const sectionGrids = node.queryAll((n) => n.class.includes('grid'), { queryLevel: 1 });
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
      if (nextSibling.tag === 'p' && nextSibling.firstChild?.tag === 'em') {
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

      return {
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
      };
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
};

export const injectedComponents = [
  {
    tag: 'div',
    class: ['theming'],
    children: [],
    attributes: [],
  },
];
