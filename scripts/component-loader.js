import { config, getBreakPoint, collectParams, loadModule } from './libs.js';
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
    element.append(...this.block.children);
    const params = collectParams(this.blockName, this.block.classList, await ComponentMixin.getMixins(), this.handler && this.handler.knownAttributes);
    Object.keys(params).forEach((key) => {
      element.setAttribute(key, params[key]);
    });
    const initialized = new Promise((resolve) => {
      const initListener = async (event) => {
        if(event.detail.block === element) {
          element.removeEventListener('initialized', initListener);
          await ComponentMixin.startAll(element);
          resolve();
        }
      };
      element.addEventListener('initialized', initListener);
    });
    this.block.replaceWith(element);
    await initialized;
  }

  async start() {
    try {
      let cssLoaded = Promise.resolve();
      if (!this.handler) {
        this.handler = new Promise(async (resolve, reject) => {
          try {
            const { css, js } = loadModule(this.pathWithoutExtension);
            cssLoaded = css;
            const mod = await js;
            if(this.isWebComponentClass(mod.default)) {
              customElements.define(this.webComponentName, mod.default);
            }
            resolve(mod.default);
          } catch(e) {
            reject(e);
          }
        });
      }
      this.handler = await this.handler;
      if(this.block) {
        if(this.isWebComponentClass()) {
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
