import {
  prepareGrid,
  cleanEmptyNodes,
  cleanEmptyTextNodes,
  inject,
  loadModules,
  toWebComponent,
  eagerImage,
  replaceTemplatePlaceholders,
  forPreviewManipulation,
} from './dom-reducers.js';
import { curryManipulation, recursive } from './dom-utils.js';

// preset manipulation for main page
export const pageManipulation = curryManipulation([
  recursive(cleanEmptyTextNodes),
  recursive(cleanEmptyNodes),
  recursive(eagerImage),
  inject,
  toWebComponent,
  recursive(prepareGrid),
  loadModules,
  await forPreviewManipulation('highlightTemplatePlaceholders'),
]);

// preset manipulation for fragments and external HTML
export const generalManipulation = curryManipulation([
  recursive(cleanEmptyTextNodes),
  recursive(cleanEmptyNodes),
  toWebComponent,
  recursive(prepareGrid),
  loadModules,
]);

export const templateManipulation = curryManipulation([
  recursive(cleanEmptyTextNodes),
  recursive(cleanEmptyNodes),
  toWebComponent,
  recursive(prepareGrid),
  loadModules,
  replaceTemplatePlaceholders,
]);
