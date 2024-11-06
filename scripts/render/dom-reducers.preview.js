/* eslint-disable import/prefer-default-export */

import { tplPlaceholderCheck, queryTemplatePlaceholders } from './dom-utils.js';
import { isTemplatePage } from '../libs.js';

export const highlightTemplatePlaceholders = (tplVirtualDom) => {
  tplVirtualDom.queryAll((node) => {
    if (!tplPlaceholderCheck('p', node)) return false;
    node.class.push('template-placeholder');
    return true;
  });
};

export const noContentPlaceholder = (node) => {
  node.class.push('template-placeholder');
  node.append({
    tag: 'span',
    class: ['error-message-box'],
    text: "This template placeholder doesn't have content in this page",
  });
};

export const duplicatedPlaceholder = (placeholdersNodes, placeholders, markAll = false) => {
  const duplicatedPlaceholders = [];

  // filter duplicated placeholder excluding the first one.
  let duplicatesNodes = placeholders.flatMap((placeholder, i) => {
    if (placeholders.indexOf(placeholder) === i) return [];
    duplicatedPlaceholders.push(...placeholders.splice(i, 1));
    return placeholdersNodes.splice(i, 1);
  });

  // Also include the first duplicated placeholder
  if (markAll) {
    duplicatesNodes = duplicatesNodes.flatMap((dn, i) => {
      const index = placeholders.indexOf(duplicatedPlaceholders[i]);
      placeholders.splice(index, 1);
      return [...placeholdersNodes.splice(index, 1), dn];
    });
  }

  duplicatesNodes.forEach((node) => {
    node.class.push('template-placeholder');
    node.append({
      tag: 'span',
      class: ['error-message-box'],
      text: 'This template placeholder is duplicated in the template',
    });
  });
};

export const tplPageDuplicatedPlaceholder = (tplVirtualDom) => {
  if (!isTemplatePage()) return;
  const { placeholdersNodes, placeholders } = queryTemplatePlaceholders(tplVirtualDom);
  duplicatedPlaceholder(placeholdersNodes, placeholders, true);
};
