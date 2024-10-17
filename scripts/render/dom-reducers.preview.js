/* eslint-disable import/prefer-default-export */

import { tplPlaceholderCheck } from './dom-utils.js';

export const highlightTemplatePlaceholders = (tplVirtualDom) => {
  tplVirtualDom.queryAll((n) => {
    if (!tplPlaceholderCheck(n)) return false;
    n.class.push('template-placeholder');
    return true;
  });
};
