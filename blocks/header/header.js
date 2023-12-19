import {
  loadBlocks,
} from '../../scripts/lib-franklin.js';
import {
  decorateMain,
} from '../../scripts/scripts.js';

export default async function decorate(block) {
  decorateMain(block);
  loadBlocks(block);
}
