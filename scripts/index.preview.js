import { isPreview, loadModule } from './libs.js';

// init editor if message from parent
window.addEventListener('message', async (e) => {
  if (e && e.data) {
    const { message, params } = e.data;
    if (!Array.isArray(params)) {
      const query = new URLSearchParams(window.location.search);
      switch (message) {
        case 'raqn:editor:start':
          (async function startEditor() {
            const editor = await import('./editor.js');
            const { origin, target, preview = false } = params;
            setTimeout(() => {
              editor.default(origin, target, preview);
            }, 2000);
          })();
          break;
        // other cases?
        case 'raqn:editor:preview:component':
          // preview editor with only a component
          if (query.has('preview')) {
            (async function startEditor() {
              const preview = query.get('preview');
              const win = await import('./editor-preview.js');
              const { uuid } = params;

              if (uuid === preview) {
                win.default(params.component, params.classes, uuid);
              }
            })();
          }
          break;
        default:
          break;
      }
    }
  }
});

export default {
  async init() {
    this.loadPreviewStyles();
  },

  async loadPreviewStyles() {
    if (!isPreview()) return;
    loadModule('/styles/styles.preview', { loadJS: false, loadCss: true });
  },
}.init();
