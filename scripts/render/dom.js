// define instances for web components
window.raqnInstances = window.raqnInstances || {};

export const { raqnInstances } = window;

// recursive apply the path of the parent / current node
export const recursiveParent = (node) => {
  const current = `${node.tag}${node.class.length > 0 ? `.${[...node.class].join('.')}` : ''}`;
  if (node.parentNode) {
    return `${recursiveParent(node.parentNode)} ${node.tag ? current : 'textNode'}`;
  }
  return current;
};

const getSettings = (nodes) =>
  (nodes.length > 1 && Object.hasOwn(nodes.at(-1), 'processChildren') && nodes.pop()) || {};

const nodeDefaults = () => ({
  isRoot: true,
  tag: null,
  class: [],
  id: null,
  parentNode: null,
  children: [],
  customProps: {},
  attributes: {},
  text: null,
});

// proxy object to enhance virtual dom node object.
export function nodeProxy(rawNode) {
  return new Proxy(rawNode, {
    get(target, prop, receiver) {
      if (prop === 'hasAttributes') {
        return () => Object.keys(target.attributes).length > 0;
      }

      if (prop === 'path') {
        return recursiveParent(target);
      }

      if (prop === 'uuid') {
        return target.reference.uuid;
      }

      if (prop === 'nextSibling') {
        const { siblings } = target;
        return siblings[siblings.indexOf(receiver) + 1];
      }

      if (prop === 'previousSibling') {
        const { siblings } = target;
        return siblings[siblings.indexOf(receiver) - 1];
      }

      if (prop === 'firstChild') {
        return target.children.at(0);
      }

      if (prop === 'lastChild') {
        return target.children.at(-1);
      }

      // mehod
      if (prop === 'hasParentNode') {
        return target.parentNode && target.parentNode.isProxy;
      }

      // mehod
      if (prop === 'hasOnlyChild') {
        return (tagName) => target.children.length === 1 && target.children[0].tag === tagName;
      }

      // mehod
      if (prop === 'hasClass') {
        return (...classes) => classes.every((cls) => target.class.includes(cls));
      }

      // mehod
      if (prop === 'removeClass') {
        return (cls) => target.class.splice(target.class.indexOf(cls), 1);
      }

      // mehod
      if (prop === 'hasAttributes') {
        return (...attributes) => attributes.every((attr) => Object.keys(target.attributes).includes(attr));
      }

      // mehod
      if (prop === 'remove') {
        return () => {
          const { parentNode } = target;
          parentNode.children = parentNode.children.filter((child) => child !== receiver);
        };
      }

      if (prop === 'removeChildren') {
        return () => {
          receiver.children = [];
        };
      }

      if (prop === 'replace') {
        return (node) => {
          Object.entries(node).forEach(([key, value]) => {
            target[key] = value;
          });
          // eslint-disable-next-line no-param-reassign
        };
      }

      // mehod
      if (prop === 'replaceWith') {
        return (...nodes) => {
          // a tree node, so we need to replace it in the parent
          if (target.parentNode?.children.length > 0) {
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({ nodes, ...getSettings(nodes) });
          target.parentNode.children = [...target.parentNode.children].splice(target.indexInSiblings, 1, ...newNodes);
          } else {
            console.log('replaceWith: node has no parent', target, nodes);
            console.error('replaceWith: node has no parent');
          }
        };
      }

      // mehod
      if (prop === 'wrapWith') {
        return (wrapper) => {
          
          // it's a single node with siblings, so we need to wrap it and replace it in the parent
          if (target.parentNode?.children.length > 0) {
            const arrayCopy = [...target.parentNode.children];
            arrayCopy.splice(target.indexInSiblings, 1, wrapper);
            target.parentNode.children = arrayCopy;
          }
          // it's a single lose node, so we need to wrap it and return the wrapper
          wrapper.children = [receiver];
          return wrapper;
        };
      }

      if (prop === 'clone') {
        return () => nodeProxy({ ...target });
      }

      // mehod
      if (prop === 'after') {
        return (...nodes) => {
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({ nodes, ...getSettings(nodes) });
          receiver.parentNode.children = [...receiver.parentNode.children].splice(receiver.indexInSiblings + 1, 0, ...newNodes);
          return newNodes;
        };
      }

      // mehod
      if (prop === 'before') {
        return (...nodes) => {
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({ nodes, ...getSettings(nodes) });
          target.parentNode.children = [...receiver.parentNode.children].splice(receiver.indexInSiblings, 0, ...newNodes);
        };
      }

      // mehod
      if (prop === 'append') {
        return (...nodes) => {
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({
            nodes,
            ...getSettings(nodes),
          });
          // trigger setter
          receiver.children = [...target.children, ...newNodes];
        };
      }

      if (prop === 'prepend') {
        return (...nodes) => {
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({
            nodes,
            ...getSettings(nodes),
          });
          // trigger setter
          receiver.children = [...target.children,...newNodes];
        };
      }

      // mehod
      if (prop === 'newChildren') {
        return (...nodes) => {
          receiver.removeChildren();
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({ nodes, ...getSettings(nodes) });
          receiver.children = [...receiver.children,...newNodes];
        };
      }

      // mehod  
      if (prop === 'queryAll') {
        return (fn, settings) => {
          const isMatch = fn(receiver, settings);
          const childs = receiver.children.reduce((matchs,node) =>  [...matchs,...node.queryAll(fn, settings)],[]);
          return [...(isMatch ? [receiver] : []), ...childs];
        };
      }

      if (prop === 'isProxy') {
        return true;
      }

      if (prop === 'toJSON') {
        return () => {
          const copy = { ...target };
          delete copy.reference;
          delete copy.parentNode;
          delete copy.siblings;
          const childrenJson = copy.children.map((child) => child.toJSON());
          return { ...copy, children: childrenJson }; ;
        };
      }

      return target[prop];
    },
    set(target, prop, value, receiver) {
      // children setter handler and cleanup in one place
      if (prop === 'children' && Array.isArray(value)) {
        target.children.forEach((child) => {
          child.parentNode = null;
          child.siblings = [];
          child.indexInSiblings = null;
        });
        value.forEach((child) => {
          child.parentNode = receiver;
          child.siblings = value;
          child.indexInSiblings = value.indexOf(child);
        });
        target.children = value;
        return true;
      }
      target[prop] = value;
      return true;
    },
  });
}

// This method ensure new nodes added to the virtual dom are using the proxy.
// Any plain object node will be wrapped in the proxy and parent/children dependencies will be handled.
function createNodes({ nodes } = {}) {
  return nodes.map((n) => {
    if (n.isProxy) return n;
    return nodeProxy({
        ...nodeDefaults(),
        ...n || {},
      });
  });
}

// extract the virtual dom from the real dom
export const generateVirtualDom = (dom, { reference = true } = {}) => {
  // eslint-disable-next-line no-plusplus
  const element = dom;
  const classList = element.classList && element.classList.length > 0 ? [...element.classList] : [];
  const attributes = {};
  if (element.hasAttributes?.()) {
    // eslint-disable-next-line no-plusplus
    for (let j = 0; j < element.attributes.length; j++) {
      const { name, value } = element.attributes[j];
      if (!['id', 'class'].includes(name)) {
        attributes[name] = value;
      }
    }
  }
  const { childNodes } = element;
  const childrenNodes = childNodes.length ? Array.from(childNodes).map(child => generateVirtualDom(child, { reference })) : [];
  
  const node = nodeProxy({
    ...nodeDefaults(),
  });
  node.isRoot = false;
  node.tag = element.tagName ? element.tagName.toLowerCase() : 'textNode';
  node.class = classList;
  node.id = element.id;
  node.attributes = attributes;
  node.text = element.textContent;
  node.children = childrenNodes;

  return node;
};

// render the virtual dom into real dom
export const renderVirtualDom = (virtualNode) => {
  // eslint-disable-next-line no-plusplus

  if (virtualNode.tag !== 'textNode') {
    const el = document.createElement(virtualNode.tag);
    el.virtualNode = virtualNode;
    
    if (virtualNode.tag.indexOf('raqn-') === 0) {
      el.setAttribute('raqnwebcomponent', '');
      window.raqnInstances[virtualNode.tag] ??= [];
      window.raqnInstances[virtualNode.tag].push(el);
    }

    if (virtualNode.class?.length > 0) el.classList.add(...virtualNode.class);
    if (virtualNode.id) el.id = virtualNode.id;
    
    Object.entries(virtualNode.attributes).forEach(([name, value]) => {
      el.setAttribute(name, value);
    });

    Object.entries(virtualNode.customProps).forEach(([name, value]) => {
      el[name] = value;
    });

    virtualNode.reference = el;
    const children = virtualNode.children ? virtualNode.children.map(node => renderVirtualDom(node)) : null;
    if (children) el.append(...children);
    return el;
  } 

  const textNode = document.createTextNode(virtualNode.text);
  virtualNode.reference = textNode;
  textNode.virtualNode = virtualNode;
  return textNode;

};

export const createNode = (node) => nodeProxy({ ...nodeDefaults(), ...node });