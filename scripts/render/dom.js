import { queryAllNodes } from './dom-utils.js';

// define instances for web components
window.raqnInstances = window.raqnInstances || {};

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
  isRoot: null,
  tag: null,
  class: [],
  id: null,
  parentNode: null,
  siblings: [],
  children: [],
  customProps: {},
  attributes: {},
  text: null,
});

// proxy object to enhance virtual dom node object.
export function nodeProxy(rawNode) {
  const proxyNode = new Proxy(rawNode, {
    get(target, prop) {
      if (prop === 'hasAttributes') {
        return () => Object.keys(target.attributes).length > 0;
      }

      if (prop === 'path') {
        return recursiveParent(target);
      }

      if (prop === 'uuid') {
        return rawNode.reference.uuid;
      }

      if (prop === 'nextSibling') {
        const { siblings } = target;
        return siblings[siblings.indexOf(proxyNode) + 1];
      }

      if (prop === 'previousSibling') {
        const { siblings } = target;
        return siblings[siblings.indexOf(proxyNode) - 1];
      }

      if (prop === 'indexInSiblings') {
        return target.siblings.indexOf(proxyNode);
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
          const { siblings } = target;
          target.parentNode = null;
          target.siblings = [];
          siblings.splice(siblings.indexOf(proxyNode), 1);
        };
      }

      if (prop === 'removeChildren') {
        return () => {
          const { children } = target;
          children.forEach((node) => {
            node.parentNode = null;
            node.siblings = [];
          });
          children.splice(0, children.length);
        };
      }

      // mehod
      if (prop === 'replaceWith') {
        return (...nodes) => {
          const { siblings } = target;
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({ nodes, siblings, parentNode: target.parentNode, ...getSettings(nodes) });
          target.parentNode = null;
          target.siblings = [];
          siblings.splice(siblings.indexOf(proxyNode), 1, ...newNodes);
        };
      }

      // mehod
      if (prop === 'wrapWith') {
        return (node) => {
          node.children = [proxyNode];
          proxyNode.replaceWith(node);
        };
      }

      // mehod
      if (prop === 'after') {
        return (...nodes) => {
          const { siblings } = target;
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({ nodes, siblings, parentNode: target.parentNode, ...getSettings(nodes) });
          siblings.splice(siblings.indexOf(proxyNode) + 1, 0, ...newNodes);
        };
      }

      // mehod
      if (prop === 'before') {
        return (...nodes) => {
          const { siblings } = target;
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({ nodes, siblings, parentNode: target.parentNode, ...getSettings(nodes) });
          siblings.splice(siblings.indexOf(proxyNode), 0, ...newNodes);
        };
      }

      // mehod
      if (prop === 'append') {
        return (...nodes) => {
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({
            nodes,
            siblings: target.children,
            parentNode: proxyNode,
            ...getSettings(nodes),
          });
          target.children.push(...newNodes);
        };
      }

      if (prop === 'prepend') {
        return (...nodes) => {
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({
            nodes,
            siblings: target.children,
            parentNode: proxyNode,
            ...getSettings(nodes),
          });
          target.children.unshift(...newNodes);
        };
      }

      // mehod
      if (prop === 'newChildren') {
        return (...nodes) => {
          const { children } = target;
          proxyNode.removeChildren();
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({ nodes, siblings: children, parentNode: proxyNode, ...getSettings(nodes) });
          children.push(...newNodes);
        };
      }

      // mehod
      if (prop === 'queryAll') {
        return (fn, settings) => queryAllNodes(target.children, fn, settings);
      }

      if (prop === 'isProxy') {
        return true;
      }

      return target[prop];
    },
  });
  return proxyNode;
}

// This method ensure new nodes added to the virtual dom are using the proxy.
// Any plain object node will be wrapped in the proxy and parent/children dependencies will be handled.
function createNodes({ nodes, siblings = [], parentNode = null, processChildren = false } = {}) {
  return nodes.map((n) => {
    if (n.isProxy) {
      n.remove();
    }
    const node =
      (n.isProxy && n) ||
      nodeProxy({
        ...nodeDefaults(),
        ...n,
      });
    node.siblings = siblings;
    node.parentNode = parentNode;

    if (node.children.length && processChildren) {
      const children = [];
      const newNodes = [...node.children];
      const newChildren = [];
      children.push(
        ...createNodes({
          nodes: newNodes,
          parentNode: node,
          siblings: newChildren,
        }),
      );
      node.children = newChildren;
      node.append(...children);
    }

    return node;
  });
}

// extract the virtual dom from the real dom
export const generateVirtualDom = (realDomNodes, { reference = true, parentNode = 'virtualDom' } = {}) => {
  const isRoot = parentNode === 'virtualDom';
  const virtualDom = isRoot
    ? nodeProxy({
        ...nodeDefaults(),
        isRoot: true,
        tag: parentNode,
      })
    : {
        children: [],
      };

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < realDomNodes.length; i++) {
    const element = realDomNodes[i];
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

    const node = nodeProxy({
      ...nodeDefaults(),
      tag: element.tagName ? element.tagName.toLowerCase() : 'textNode',
      parentNode: isRoot ? virtualDom : parentNode,
      siblings: virtualDom.children,
      class: classList,
      id: element.id,
      attributes,
      text: !element.tagName ? element.textContent : null,
      reference: reference ? element : null, // no referent for stringfying the dom
    });

    const { childNodes } = element;
    node.children = childNodes.length ? generateVirtualDom(childNodes, { reference, parentNode: node }).children : [];
    virtualDom.children.push(node);
  }
  return virtualDom;
};

// render the virtual dom into real dom
export const renderVirtualDom = (virtualdom) => {
  const siblings = virtualdom.isRoot ? virtualdom.children : virtualdom;
  const dom = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < siblings.length; i++) {
    const virtualNode = siblings[i];
    const children = virtualNode.children ? renderVirtualDom(virtualNode.children) : null;
    if (virtualNode.tag !== 'textNode') {
      const el = document.createElement(virtualNode.tag);
      if (virtualNode.tag.indexOf('raqn-') === 0) {
        el.setAttribute('raqnwebcomponent', '');
        window.raqnInstances[virtualNode.tag] ??= [];
        window.raqnInstances[virtualNode.tag].push(el);
      }

      if (virtualNode.class?.length > 0) el.classList.add(...virtualNode.class);
      if (virtualNode.id) el.id = virtualNode.id;
      if (virtualNode.text?.length) el.textContent = virtualNode.text;
      if (children) el.append(...children);

      Object.entries(virtualNode.attributes).forEach(([name, value]) => {
        el.setAttribute(name, value);
      });

      Object.entries(virtualNode.customProps).forEach(([name, value]) => {
        el[name] = value;
      });

      virtualNode.reference = el;
      el.virtualNode = virtualNode;

      dom.push(el);
    } else if (virtualNode.text?.length) {
      const textNode = document.createTextNode(virtualNode.text);
      virtualNode.reference = textNode;
      textNode.virtualNode = virtualNode;
      dom.push(textNode);
    }
  }
  return dom;
};
