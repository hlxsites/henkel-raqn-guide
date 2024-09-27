export const filterNodes = (nodes, tag, className) => {
  const filtered = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.tag === tag && (className ? node.class.includes(className) : true)) {
      node.inicialIndex = i;
      filtered.push(node);
    }
  }
  return filtered;
};

export const prepareGrid = (node) => {
  if (node.children && node.children.length > 0) {
    const grids = filterNodes(node.children, 'raqn-grid');
    const gridItems = filterNodes(node.children, 'raqn-grid-item');

    grids.map((grid, i) => {
      const inicial = node.children.indexOf(grid);
      const nextGridIndex = grids[i + 1] ? node.children.indexOf(grids[i + 1]) : node.children.length;
      gridItems.map((item) => {
        const itemIndex = node.children.indexOf(item);
        // get elements between grid and item and insert into grid
        if (itemIndex > inicial && itemIndex < nextGridIndex) {
          const children = node.children.splice(inicial + 1, itemIndex - inicial);
          const gridItem = children.pop(); // remove grid item from children
          gridItem.children = children;
          grid.children.push(gridItem);
        }
      });
      return grid;
    });
  }
  return node;
};
// Compare this snippet from scripts/render/dom.js:

export const recursive = (fn) => (nodes, level) =>
  nodes.map((node) => {
    if (node.children) {
      node.children = recursive(fn)(node.children, level + 1);
    }
    return fn(node, level);
  });
