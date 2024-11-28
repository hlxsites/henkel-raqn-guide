import { isPreview, loadModule } from './libs.js';
import { subscribe } from './pubsub.js';

export default {
  async init() {
    return this.loadPreviewStyles();
  },

  async loadPreviewStyles() {
    if (!isPreview()) return;
    loadModule('/styles/styles.preview', { loadJS: false, loadCss: true });
  },
}.init().then(() => {
  subscribe('raqn:page:editor:load', () => import('./editor.js'));
});
