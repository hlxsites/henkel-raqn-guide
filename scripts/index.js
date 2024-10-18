import { generateVirtualDom, renderVirtualDom } from './render/dom.js';
import { pageManipulation, templateManipulation } from './render/dom-manipulations.js';
import { getMeta, metaTags, yieldToMain } from './libs.js';

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
    this.renderPage();
  },

  async renderPage() {
    const list = [
      () => {
        window.raqnVirtualDom = generateVirtualDom(document.body.childNodes);
      },
      () => pageManipulation(window.raqnVirtualDom),
      () => this.templateLoad(),
      () => {
        const renderedDOM = renderVirtualDom(window.raqnVirtualDom);

        if (renderedDOM) {
          document.body.innerHTML = '';
          document.body.append(...renderedDOM);
        }
      },
      () =>
        // EG callback to loadModules
        Promise.allSettled(window.initialization).then(() => {
          // some after main modules loaded
        }),
    ];

    while (list.length > 0) {
      // Shift the first task off the tasks array:
      const task = list.shift();

      // Run the task:
      // eslint-disable-next-line no-await-in-loop
      await task();

      // Yield to the main thread:
      // eslint-disable-next-line no-await-in-loop
      await yieldToMain();
    }
  },
  async templateLoad() {
    let templateContent;
    const tasks = [
      async () => {
        let tpl = getMeta(metaTags.template.metaName, { getFallback: false });
        if (!tpl) {
          templateContent = null;
          return null;
        };
        if (!tpl.includes('/')) {
          tpl = metaTags.template.fallbackContent.concat(tpl);
        }

        const path = tpl.concat('.plain.html');
        if (typeof path !== 'string') {
          templateContent = null;
          return null;
        };

        const response = await fetch(
          `${path}`,
          window.location.pathname.endsWith(path) ? { cache: this.fragmentCache } : {},
        );
        templateContent = response.ok && (await response.text());
        return templateContent;
      },
      () => {
        if (!templateContent) return;
        const element = document.createElement('div');
        element.innerHTML = templateContent;
        window.raqnTplVirtualDom = generateVirtualDom(element.childNodes);
      },
      () => {
        if (!templateContent) return null;
        return templateManipulation(window.raqnTplVirtualDom);
      },
    ];

    while (tasks.length > 0) {
      // Shift the first task off the tasks array:
      const task = tasks.shift();

      // Run the task:
      // eslint-disable-next-line no-await-in-loop
      await task();

      // Yield to the main thread:
      // eslint-disable-next-line no-await-in-loop
      await yieldToMain();
    }
  },
}.init();
