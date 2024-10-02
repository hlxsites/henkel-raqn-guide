import ComponentLoader from './component-loader.js';
import {
  globalConfig,
  metaTags,
  eagerImage,
  getMeta,
} from './libs.js';

const component = {
  async init(settings) {
    // some components may have multiple targets
    const { componentName = this.getBlockData(settings?.targets?.[0]).componentName } = settings || {};
    try {
      const loader = new ComponentLoader({
        ...settings,
        componentName,
      });
      const instances = await loader.init();
      const init = {
        componentName,
        instances: [],
        failedInstances: [],
      };

      instances.forEach((data) => {
        if (data.status === 'fulfilled') init.instances.push(data.value);
        if (data.reason) init.failedInstances.push(data.reason.elem || data.reason);
      });
      return init;
    } catch (error) {
      const init = {
        componentName,
        initError: error,
      };
      // eslint-disable-next-line no-console
      console.error(`There was an error while initializing the '${componentName}' component`, error);
      return init;
    }
  },

  async multiInit(settings) {
    const initializing = await Promise.allSettled(settings.map((s) => this.init(s)));
    const initialized = initializing.map((data) => data.value || data.reason);
    const status = {
      allInitialized: initialized.every((c) => !(c.initError || c.failedInstances.length)),
      instances: initialized,
    };
    return status;
  },

  async multiSequentialInit(settings) {
    const initialized = [];
    const sequentialInit = async (set) => {
      if (!set.length) return;
      const initializing = await this.init(set.shift());
      initialized.unshift(initializing);
      sequentialInit(set);
    };

    await sequentialInit([...settings]);

    const status = {
      allInitialized: initialized.every((c) => !(c.initError || c.failedInstances.length)),
      instances: initialized,
    };
    return status;
  },

  async loadAndDefine(componentName) {
    const status = await new ComponentLoader({ componentName }).loadAndDefine();
    return { componentName, status };
  },

  async multiLoadAndDefine(componentNames) {
    const loading = await Promise.allSettled(componentNames.map((n) => this.loadAndDefine(n)));
    const loaded = loading.map((data) => data.value || data.reason);
    const status = {
      allLoaded: loaded.every((m) => m.status.loaded),
      modules: loaded,
    };

    return status;
  },

  getBlockData(block) {
    const tagName = block.tagName.toLowerCase();
    const lcp = block.classList.contains('lcp');
    let componentName = tagName;
    if (!globalConfig.semanticBlocks.includes(tagName)) {
      componentName = block.classList.item(0) || 'section';
    }
    return { targets: [block], componentName, lcp };
  },
};

export const onLoadComponents = {
  async init() {
    const template = getMeta(metaTags.template.metaName);
    const templateConfig = getMeta(metaTags.templateConfig.metaName);

    component.init({
      componentName: template,
      path: '/templates',
      externalConfigName: templateConfig,
      targets: [document.querySelector('body > main')],
    });
  },
};

export const globalInit = {
  async init() {
    this.isPreview();
    this.setLang();
    this.initEagerImages();
    onLoadComponents.init();
  },

  // TODO - maybe take this from the url structure.
  setLang() {
    document.documentElement.lang ||= 'en';
  },

  initEagerImages() {
    const eagerImages = getMeta(metaTags.eagerImage.metaName);
    if (eagerImages) {
      const length = parseInt(eagerImages, 10);
      eagerImage(document.body, length);
    }
  },

  isPreview() {
    const { hostname } = window.location;
    const previewHosts = ['localhost', '.aem.page'];

    window.raqnIsPreview = previewHosts.some((host) => hostname.endsWith(host));
  },
};

globalInit.init();

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

export default component;
