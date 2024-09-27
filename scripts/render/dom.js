import { classToFlat } from '../libs.js';
import { cleanEmptyNodes, cleanEmptyTextNodes, loadModules, templating, toWebComponent } from './components.js';
import { prepareGrid, recursive } from './rules.js';

window.raqnInstances = window.raqnInstances || {};

export const recursiveParent = (node) => {
  const current = `${node.tag}${node.class.length > 0 ? `.${[...node.class].join('.')}` : ''}`;
  if (node.parentNode) {
    return `${recursiveParent(node.parentNode)} ${node.tag ? current : 'textNode'}`;
  }
  return current;
};

export const nodeProxy = (node) => {
  const p = new Proxy(node, {
    get(target, prop) {
      if (prop === 'hasAttributes') {
        return () => target.attributes.length > 0;
      }
      if (prop === 'path') {
        return recursiveParent(target);
      }
      if (prop === 'uuid') {
        return node.reference.uuid;
      }

      if (prop === 'nextSibling') {
        if (target.parentNode) {
          return target.parentNode.children[target.indexInParent + 1];
        }
        return false;
      }
      if (prop === 'previousSibling') {
        if (target.parentNode) {
          return target.parentNode.children[target.indexInParent - 1];
        }
        return false;
      }
      return target[prop];
    },
    set(target, prop, value) {
      if (prop === 'children') {
        target.children = value;
        target.children.forEach((child, i) => {
          child.indexInParent = i;
          child.parentNode = p;
        });
        return value;
      }
      if (prop === 'parentNode') {
        target.parentNode = value;
      }

      target[prop] = value;
      return true;
    },
  });
  return p;
};

export const generateDom = (virtualdom) => {
  const dom = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < virtualdom.length; i++) {
    const element = virtualdom[i];
    const { childNodes } = element;
    const child = childNodes.length > 0 ? generateDom(childNodes) : [];
    const classList = element.classList && element.classList.length > 0 ? [...element.classList] : [];
    dom.push(
      nodeProxy({
        tag: element.tagName ? element.tagName.toLowerCase() : 'textNode',
        children: child,
        class: classList,
        attributesValues: classToFlat(classList),
        id: element.id,
        attributes: element.hasAttributes && element.hasAttributes() ? element.attributes : [],
        text: !element.tagName ? element.textContent : null,
        reference: element,
      }),
    );
  }
  return dom;
};

export const renderVirtualDom = (virtualdom) => {
  const dom = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < virtualdom.length; i++) {
    const element = virtualdom[i];
    const { children } = element;
    const child = children ? renderVirtualDom(children) : null;
    if (element.tag !== 'textNode') {
      const el = document.createElement(element.tag);
      if (element.tag.indexOf('raqn-') === 0) {
        window.raqnInstances[element.tag] = el;
      }
      if (element.class.length > 0) {
        el.classList.add(...element.class);
      }
      if (element.id) {
        el.id = element.id;
      }
      if (element.attributes) {
        // eslint-disable-next-line no-plusplus
        for (let j = 0; j < element.attributes.length; j++) {
          const { name, value } = element.attributes[j];
          el.setAttribute(name, value);
        }
      }
      element.initialAttributesValues = classToFlat(element.class);
      if (element.text) {
        el.textContent = element.text;
      }

      if (child) {
        el.append(...child);
      }
      dom.push(el);
    } else {
      dom.push(document.createTextNode(element.text));
    }
  }
  return dom;
};

export const curryManipulation =
  (items = []) =>
  (virtualdom) =>
    items.reduce((acc, m) => m(acc, 0), virtualdom);

export const manipulation = curryManipulation([
  recursive(cleanEmptyTextNodes),
  recursive(cleanEmptyNodes),
  templating,
  recursive(toWebComponent),
  recursive(prepareGrid),
  loadModules,
]);

export const generalManipulation = curryManipulation([
  recursive(cleanEmptyTextNodes),
  recursive(cleanEmptyNodes),
  recursive(toWebComponent),
  recursive(prepareGrid),
  loadModules,
]);
