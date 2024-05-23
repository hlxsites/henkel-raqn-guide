import ComponentLoader from './component-loader.js';
import { globalConfig, eagerImage, getMeta, getMetaGroup, mergeUniqueArrays } from './libs.js';

const component = {
  async init(settings) {
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
      console.error(`There was an error while initializing the ${componentName} component`, error);
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
      componentName = block.classList.item(0);
    }
    return { targets: [block], componentName, lcp };
  },
};

const onLoadComponents = {
  staticStructureComponents: [
    {
      componentName: 'image',
      block: document,
      loaderConfig: {
        targetsAsContainers: true,
        targetsSelectorsPrefix: 'main > div >',
      },
    },
    {
      componentName: 'button',
      block: document,
      loaderConfig: {
        targetsAsContainers: true,
        targetsSelectorsPrefix: 'main > div >',
      },
    },
  ],

  async init() {
    this.setLcp();
    this.setStructure();
    this.queryAllBlocks();
    this.setBlocksData();
    this.setLcpBlocks();
    this.setLazyBlocks();
    this.initBlocks();
  },

  queryAllBlocks() {
    this.blocks = [
      document.body.querySelector(globalConfig.semanticBlocks[0]),
      ...document.querySelectorAll('[class]:not([class^=style]'),
      ...document.body.querySelectorAll(globalConfig.semanticBlocks.slice(1).join(',')),
    ];
  },

  setBlocksData() {
    const structureData = this.structureComponents.map(({ componentName }) => ({
      componentName,
      block: document,
      loaderConfig: {
        targetsAsContainers: true,
      },
    }));
    structureData.push(...this.staticStructureComponents);

    const blocksData = this.blocks.map((block) => component.getBlockData(block));
    this.blocksData = [...structureData, ...blocksData];
  },

  setLcp() {
    const lcpMeta = getMeta('lcp', { getArray: true });
    const defaultLcp = ['theming', 'header', 'breadcrumbs'];
    const lcp = lcpMeta?.length ? lcpMeta : defaultLcp;
    // theming must be in LCP to prevent CLS
    this.lcp = mergeUniqueArrays(lcp, ['theming']).map((componentName) => ({
      componentName: componentName.trim(),
    }));
  },

  setStructure() {
    const structureComponents = getMetaGroup('structure');
    this.structureComponents = structureComponents.flatMap(({ name, content }) => {
      if (content !== true) return [];
      return {
        componentName: name.trim(),
      };
    });
  },

  setLcpBlocks() {
    this.lcpBlocks = this.blocksData.filter((data) => !!this.findLcp(data));
  },

  setLazyBlocks() {
    this.lazyBlocks = this.blocksData.filter((data) => !this.findLcp(data));
  },

  findLcp(data) {
    return (
      this.lcp.find(({ componentName }) => componentName === data.componentName) || data.lcp /* ||
      [...document.querySelectorAll('main > div > [class]:nth-child(-n+1)')].find((el) => el === data?.targets?.[0]) */
    );
  },

  initBlocks() {
    component.multiInit(this.lcpBlocks).then(() => {
      document.body.style.setProperty('display', 'unset');
    });
    component.multiInit(this.lazyBlocks);
  },
};

const globalInit = {
  async init() {
    this.setLang();
    this.initEagerImages();
    onLoadComponents.init();
  },

  // TODO - maybe take this from the url structure.
  setLang() {
    document.documentElement.lang ||= 'en';
  },

  initEagerImages() {
    const eagerImages = getMeta('eager-images');
    if (eagerImages) {
      const length = parseInt(eagerImages, 10);
      eagerImage(document.body, length);
    }
  },
};

globalInit.init();

// init editor if message from parent
window.addEventListener('message', async (e) => {
  if (e && e.data) {
    const { message, params } = e.data;
    if (message === 'initEditor' && !Array.isArray(params)) {
      const editor = await import('./editor.js');
      const { origin, target } = params;
      setTimeout(() => {
        editor.default(origin, target);
      }, 2000);
    }
  }
});

export default component;
