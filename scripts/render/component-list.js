/* 
list of components that will are available to be set in the dom

 [class or tag]: { => class or tag that will be replaced by the tag
    tag: string, => tag that will replace the class or tag
    script: string, => path to the script that will be loaded
    priority: number, => priority to load the script
    transform: function, => function that will transform the node
    dependencies: [string], => list of dependencies that will be loaded before the script
}

*/
export const componentList = {
  grid: {
    tag: 'raqn-grid',
    script: '/blocks/grid/grid',
    priority: 0,
    dependencies: ['grid-item'],
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
    priority: 1,
    dependencies: ['accordion', 'icon'],
  },
  'grid-item': {
    tag: 'raqn-grid-item',
    script: '/blocks/grid-item/grid-item',
    priority: 0,
  },
  icon: {
    tag: 'raqn-icon',
    script: '/blocks/icon/icon',
    priority: 1,
  },
  card: {
    tag: 'raqn-card',
    script: '/blocks/card/card',
    priority: 2,
  },
  header: {
    tag: 'raqn-header',
    script: '/blocks/header/header',
    dependencies: ['navigation', 'grid', 'grid-item'],
    priority: 1,
  },
  footer: {
    tag: 'raqn-footer',
    script: '/blocks/footer/footer',
    priority: 3,
  },
  theming: {
    tag: 'raqn-theming',
    script: '/blocks/theming/theming',
    priority: 3,
  },
  accordion: {
    tag: 'raqn-accordion',
    script: '/blocks/accordion/accordion',
    priority: 2,
  },
  popup: {
    tag: 'raqn-popup',
    script: '/blocks/popup/popup',
    priority: 3,
  },
  'popup-trigger': {
    tag: 'raqn-popup-trigger',
    script: '/blocks/popup-trigger/popup-trigger',
    priority: 3,
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
