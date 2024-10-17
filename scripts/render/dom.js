import { classToFlat } from '../libs.js';
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

      if (prop === 'hasOnlyChild') {
        return (tagName) => target.children.length === 1 && target.children[0].tag === tagName;
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
          const newNodes = createNodes({ nodes, siblings, parentNode: target.parentNode });
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
          const newNodes = createNodes({ nodes, siblings, parentNode: target.parentNode });
          siblings.splice(siblings.indexOf(proxyNode) + 1, 0, ...newNodes);
        };
      }

      // mehod
      if (prop === 'before') {
        return (...nodes) => {
          const { siblings } = target;
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({ nodes, siblings, parentNode: target.parentNode });
          siblings.splice(siblings.indexOf(proxyNode), 0, ...newNodes);
        };
      }

      // mehod
      if (prop === 'append') {
        return (...nodes) => {
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({ nodes, siblings: target.children, parentNode: proxyNode });
          target.children.push(...newNodes);
        };
      }

      if (prop === 'prepend') {
        return (...nodes) => {
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({ nodes, siblings: target.children, parentNode: proxyNode });
          target.children.unshift(...newNodes);
        };
      }

      // mehod
      if (prop === 'newChildren') {
        return (...nodes) => {
          const { children } = target;
          proxyNode.removeChildren();
          // eslint-disable-next-line no-use-before-define
          const newNodes = createNodes({ nodes, siblings: children, parentNode: proxyNode });
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

    set(target, prop, value) {
      // if (prop === 'children') {
      //   target.children = value;
      //   target.children.forEach((child, i) => {
      //     child.indexInParent = i;
      //     child.parentNode = p;
      //     console.log('chidren is read only property');
      //   });
      //   return value;
      // }

      // if (['children'].includes(prop)) {
      //   // set value only once, then mutate the object
      //   if (!target[prop] && Array.isArray(value)) {
      //     target[prop] = value;
      //   }
      // }

      // if (prop === 'parentNode') {
      //   target.parentNode = value;
      // }

      target[prop] = value;
      return true;
    },
  });
  return proxyNode;
}

function createNodes({ nodes, siblings = [], parentNode = null }) {
  return nodes.map((n) => {
    if (n.isProxy) {
      n.remove();
    }
    const node =
      (n.isProxy && n) ||
      nodeProxy({
        class: [],
        attributes: [],
        children: [],
        ...n,
      });
    node.siblings = siblings;
    node.parentNode = parentNode;

    if (node.children.length) {
      const children = [];
      const newNodes = [...node.children];
      node.removeChildren();

      children.push(
        ...createNodes({
          nodes: newNodes,
          parentNode: node,
          siblings: node.children,
        }),
      );
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
        isRoot: true,
        tag: parentNode,
        parentNode: null,
        siblings: [],
        children: [],
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
        attributes[name] = value;
      }
    }

    const node = nodeProxy({
      parentNode: isRoot ? virtualDom : parentNode,
      siblings: virtualDom.children,
      tag: element.tagName ? element.tagName.toLowerCase() : 'textNode',
      class: classList,
      attributesValues: classToFlat(classList),
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
    const { children } = virtualNode;
    const child = children ? renderVirtualDom(children) : null;
    if (virtualNode.tag !== 'textNode') {
      const el = document.createElement(virtualNode.tag);
      if (virtualNode.tag.indexOf('raqn-') === 0) {
        el.setAttribute('raqnwebcomponent', '');
        if (!window.raqnInstances[virtualNode.tag]) {
          window.raqnInstances[virtualNode.tag] = [];
        }
        window.raqnInstances[virtualNode.tag].push(el);
      }
      if (virtualNode.class?.length > 0) {
        el.classList.add(...virtualNode.class);
      }
      if (virtualNode.id) {
        el.id = virtualNode.id;
      }
      if (virtualNode.attributes) {
        // eslint-disable-next-line no-plusplus
        Object.keys(virtualNode.attributes).forEach((name) => {
          const value = virtualNode.attributes[name];
          el.setAttribute(name, value);
        });
      }
      virtualNode.initialAttributesValues = classToFlat(virtualNode.class);
      if (virtualNode.text) {
        el.textContent = virtualNode.text;
      }

      if (child) {
        el.append(...child);
      }
      dom.push(el);
    } else {
      dom.push(document.createTextNode(virtualNode.text));
    }
  }
  return dom;
};
