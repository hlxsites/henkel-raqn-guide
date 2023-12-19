import {
  addCssVariables,
} from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const columns = block.querySelectorAll(':scope > div > div');
  const columnCount = columns.length;
  // following line regex matches partition sizes separated by dashes like 1-2-3
  const columnPartionRegex = /^\d{1,}(?:-\d{1,})*$/;
  const columnPartions = [...block.classList].find((c) => columnPartionRegex.test(c))?.split('-') || [];

  const variables = {};
  for (let i = 0; i < columnCount; i += 1) {
    const partition = columnPartions.length > i ? columnPartions[i] : 1;
    variables[`column${i}-flex`] = partition;
  }
  addCssVariables(block, variables);
}
