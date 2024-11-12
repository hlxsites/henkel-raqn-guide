import {
  prepareGrid,
  cleanEmptyNodes,
  inject,
  loadModules,
  toWebComponent,
  eagerImage,
  replaceTemplatePlaceholders,
  buildTplPlaceholder,
  forPreviewManipulation,
} from './dom-reducers.js';
import { curryManipulation, recursive } from './dom-utils.js';
import { isPreview } from '../libs.js';

const { tplPageDuplicatedPlaceholder, highlightTemplatePlaceholders } = await forPreviewManipulation();

// ! curryManipulation returns a promise.
// preset manipulation for main page
export const pageManipulation = curryManipulation([
  recursive(cleanEmptyNodes),
  recursive(eagerImage),
  isPreview() && recursive(buildTplPlaceholder),
  inject,
  toWebComponent,
  recursive(prepareGrid),
  loadModules,
  tplPageDuplicatedPlaceholder,
  highlightTemplatePlaceholders,
]);

// preset manipulation for fragments and external HTML
export const generalManipulation = curryManipulation([
  recursive(cleanEmptyNodes),
  toWebComponent,
  recursive(prepareGrid),
  loadModules,
]);

export const templateManipulation = curryManipulation([
  recursive(cleanEmptyNodes),
  recursive(buildTplPlaceholder),
  toWebComponent,
  recursive(prepareGrid),
  loadModules,
  replaceTemplatePlaceholders,
]);
