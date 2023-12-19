import {
  addCssVariables,
} from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const elements = [...block.querySelectorAll(':scope > div')];

  const columnTemplate = elements.find((e) => e.dataset.gridColumns)?.dataset.gridColumns;
  const rowTemplate = elements.find((e) => e.dataset.gridRows)?.dataset.gridRows;
  if (columnTemplate || rowTemplate) {
    addCssVariables(block, {
      'grid-template-columns': columnTemplate,
      'grid-template-rows': rowTemplate,
    });
  }

  elements.forEach((e) => {
    e.classList.add('element');

    const [[startColumnPosition, startRowPosition], [endColumnPosition, endRowPosition]] = e.dataset.gridPosition.split(/\s*\/\s*/).map((p) => p.split(/\s*-\s*/));

    addCssVariables(e, {
      'grid-column-start-position': startColumnPosition,
      'grid-row-start-position': startRowPosition,
      'grid-column-end-position': endColumnPosition,
      'grid-row-end-position': endRowPosition,
    });
  });
}
