export const recursive =
  (fn) =>
  (virtualDom, stopLevel, currentLevel = 1) => {
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
  const { currentLevel = 1, queryLevel } = settings || {};
  return nodes.reduce((acc, node) => {
    const match = fn(node);
    if (match) acc.push(node);
    if (node.children.length && (!queryLevel || currentLevel < queryLevel)) {
      const fromChilds = queryAllNodes(node.children, fn, { currentLevel: currentLevel + 1, queryLevel });
      acc.push(...fromChilds);
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

// receives a array of action to reduce the virtual dom
export const curryManipulation =
  (manipulations = []) =>
  (virtualDom) =>
    manipulations
      .filter((fn) => typeof fn === 'function')
      .reduce((acc, manipulation) => manipulation(acc, 0) || acc, virtualDom);

export const tplPlaceholderCheck = (node) =>
  node.tag === 'p' && node.hasOnlyChild('textNode') && node.firstChild.text.match(/\$\{tpl-content-[a-zA-Z1-9-]+\}/g);

export const getTplPlaceholder = (node) => node.firstChild.text.trim().replace(/^\$\{|\}$/g, '');
