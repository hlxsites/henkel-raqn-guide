import {
  prepareGrid,
  cleanEmptyNodes,
  inject,
  loadModules,
  toWebComponent,
  pageManipulationBundle,
  generalManipulationBundle,
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
  recursive(pageManipulationBundle),
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
  recursive(generalManipulationBundle),
  toWebComponent,
  recursive(prepareGrid),
  loadModules,
]);

export const templateManipulation = curryManipulation([
  recursive(cleanEmptyNodes),
  recursive(generalManipulationBundle),
  recursive(buildTplPlaceholder),
  toWebComponent,
  recursive(prepareGrid),
  loadModules,
  replaceTemplatePlaceholders,
]);
