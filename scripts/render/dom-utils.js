import { yieldToMain } from '../libs.js';

export const recursive =
  (fn) =>
  async (virtualDom, stopLevel, currentLevel = 1) => {
    if (stopLevel && stopLevel < currentLevel) return;
    const localNodes = [...virtualDom.children];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < localNodes.length; i++) {
      const node = localNodes[i];
      if (node.children.length) {
        recursive(fn)(node, stopLevel, currentLevel + 1);
      }
      fn(node, currentLevel);
    }
  };

export const queryAllNodes = (nodes, fn, settings) => {
  const { currentLevel = 1, queryLevel = 1 } = settings || {};
  return nodes.reduce((acc, node) => {
    console.log('node', node);
    const hasParent = node.hasParentNode;
    const match = fn(node);
    const wasRemoved = !node.hasParentNode && hasParent;

    if (match) acc.push(node);
    // If this will throw an error it means the node was not created properly using the `createNodes()` method
    // with the `processChildren` option set to `true` if the node has children.
    // ! do not fix the error here by checking is node.children exists.
    try {
      // if the node was removed during the query skip the children.
      if (wasRemoved) return acc;
      if (node.children.length && (!queryLevel || currentLevel < queryLevel)) {
        const fromChildren = queryAllNodes(node.children, fn, { currentLevel: currentLevel + 1, queryLevel });
        acc.push(...fromChildren);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Node was not properly created using the `createNodes()` method with the `processChildren` option set to true if the node has children: ',
        error,
      );
    }

    return acc;
  }, []);
};

export const queryNode = (nodes, fn) => {
  let n = null;
  nodes.some((node) => {
    const match = fn(node);
    if (match) {
      n = node;
      return true;
    }
    if (node.children.length) {
      const childNodeMatch = queryNode(node.children, fn);
      if (childNodeMatch) {
        n = childNodeMatch;
        return true;
      }
    }
    return false;
  });
  return n;
};

// Receives a array of action to reduce the virtual dom
// This function has the potential to generate a task with high blocking time
// to mitigate this issue yieldToMain approach is used.
export const curryManipulation =
  (manipulations = []) =>
  async (virtualDom) => {
    const m = manipulations.filter((fn) => typeof fn === 'function');
    while (m.length > 0) {
      // Shift the first task off the tasks array:
      const mutation = m.shift();

      // Run the task:
      // eslint-disable-next-line no-await-in-loop
      await mutation(virtualDom);

      // Yield to the main thread:
      // eslint-disable-next-line no-await-in-loop
      await yieldToMain();
    }
    return virtualDom;
  };

export const tplPlaceholderCheck = (node) =>
  node.text?.match(/\$\{tpl-content-[a-zA-Z1-9-]+\}/g);

export const getTplPlaceholder = (node) => node.text.trim().replace(/^\$\{|\}$/g, '');

export const queryTemplatePlaceholders = (tplVirtualDom) => {
  const placeholders = [];
  const placeholdersNodes = tplVirtualDom.queryAll((n) => {
    if (!tplPlaceholderCheck(n)) return false;
    const placeholder = getTplPlaceholder(n);
    placeholders.push(placeholder);
    return true;
  });
  return { placeholders, placeholdersNodes };
};

export const getClassWithPrefix = (node, prefix) =>
  node.class.find((cls, i) => cls.startsWith(prefix) && node.class.splice(i, 1))?.slice(prefix.length);

export const setPropsAndAttributes = (node) => {
  const externalConfig = getClassWithPrefix(node, 'config-');

  if (externalConfig) {
    node.attributes['config-id'] = externalConfig;
  }
};
