import ComponentLoader from './component-loader.js';
import { globalConfig, eagerImage, getMeta, getMetaGroup } from './libs.js';

const component = {
  async init(settings) {
    return new ComponentLoader({
      ...settings,
      componentName: settings.componentName ?? this.getBlockData(settings?.targets?.[0]).componentName,
    }).init();
  },

  async loadAndDefine(componentName) {
    await new ComponentLoader({ componentName }).loadAndDefine();
  },

  getBlockData(block) {
    const tagName = block.tagName.toLowerCase();
    const lcp = block.classList.contains('lcp');
    let componentName = tagName;
    if (!globalConfig.semanticBlocks.includes(tagName)) {
      componentName = block.classList.item(0);
    }
    return { block, componentName, lcp };
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
    const lcpMeta = getMeta('lcp');
    const defaultLcp = ['theme', 'header', 'breadcrumbs'];
    this.lcp = lcpMeta?.length
      ? lcpMeta.split(',').map((componentName) => ({ componentName: componentName.trim() }))
      : defaultLcp;
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
      [...document.querySelectorAll('main > div > [class]:nth-child(-n+2)')].find((el) => el === data.block) */
    );
  },

  initBlocks() {
    Promise.all(
      this.lcpBlocks.map(async ({ componentName, block, loaderConfig }) =>
        component.init({ componentName, targets: [block], loaderConfig }),
      ),
    ).then(() => {
      document.body.style.display = 'unset';
    });
    this.lazyBlocks.map(({ componentName, block, loaderConfig }) =>
      setTimeout(() => component.init({ componentName, targets: [block], loaderConfig })),
    );
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

export default component;
