import { config, collectAttributes, loadModule } from './libs.js';
import ComponentMixin from './component-mixin.js';

export default class ComponentLoader {
  constructor(blockName, element) {
    window.raqnComponents = window.raqnComponents || {};
    this.blockName = blockName;
    this.pathWithoutExtension = `/blocks/${this.blockName}/${this.blockName}`;
    this.block = element;
    if (this.block) {
      this.content = this.block.children;
    }
  }

  get handler() {
    return window.raqnComponents[this.blockName];
  }

  set handler(handler) {
    window.raqnComponents[this.blockName] = handler;
  }

  isWebComponentClass(clazz = this.handler) {
    return clazz.toString().startsWith('class');
  }

  get webComponentName() {
    return `raqn-${this.blockName.toLowerCase()}`;
  }

  async setupElement() {
    const element = document.createElement(this.webComponentName);
    element.blockName = this.blockName;
    element.webComponentName = this.webComponentName;
    element.append(...this.block.children);
    const { currentAttributes } = collectAttributes(
      this.blockName,
      this.block.classList,
      await ComponentMixin.getMixins(),
      this?.handler?.knownAttributes,
      element,
    );
    Object.keys(currentAttributes).forEach((key) => {
      element.setAttribute(key, currentAttributes[key]);
    });

    const initialized = new Promise((resolve) => {
      const initListener = async (event) => {
        if (event.detail.block === element) {
          element.removeEventListener('initialized', initListener);
          await ComponentMixin.startAll(element);
          resolve();
        }
      };
      element.addEventListener('initialized', initListener);
    });
    const isSemanticElement = config.semanticBlocks.includes(this.block.tagName.toLowerCase());
    const addComponentMethod = isSemanticElement ? 'append' : 'replaceWith';
    this.block[addComponentMethod](element);
    await initialized;
  }

  async start() {
    try {
      let cssLoaded = Promise.resolve();
      if (!this.handler) {
        this.handler = (async () => {
          const { css, js } = loadModule(this.pathWithoutExtension);
          cssLoaded = css;
          const mod = await js;
          if (this.isWebComponentClass(mod.default)) {
            window.customElements.define(this.webComponentName, mod.default);
          }
          return mod.default;
        })();
      }
      this.handler = await this.handler;
      if (this.block) {
        if (this.isWebComponentClass()) {
          await this.setupElement();
        } else {
          await this.handler(this.block);
        }
      }
      await cssLoaded;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`failed to load module for ${this.blockName}`, error);
    }
  }
}
