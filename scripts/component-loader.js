import { config, getBreakPoint } from './libs.js';

export default class ComponentLoader {
  constructor(blockName, element) {
    window.raqnComponents = window.raqnComponents || {};
    this.blockName = blockName;
    this.setBlockPaths();
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

  setBlockPaths() {
    this.cssPath = `/blocks/${this.blockName}/${this.blockName}.css`;
    this.jsPath = `/blocks/${this.blockName}/${this.blockName}.js`;
  }

  get webComponentName() {
    return `raqn-${this.blockName.toLowerCase()}`;
  }

  async loadCSS(href) {
    return new Promise((resolve, reject) => {
      if (!document.querySelector(`head > link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = reject;
        document.head.append(link);
      } else {
        resolve();
      }
    });
  }

  loadParams() {
    const mediaParams = {};
    const knownAttributes = (this.handler && this.handler.knownAttributes) || [];
    return {
      ...Array.from(this.block.classList)
        .filter((c) => c !== this.blockName && c !== 'block')
        .reduce((acc, c) => {
          const values = c.split('-');
          let key = values.shift();
          const breakpoint = getBreakPoint();
          if (breakpoint === key) {
            key = values.shift();
            mediaParams[key] = values.join('-');
            return acc;
          }

          // param does not apply because it is for a different breakpoint
          if (config.breakpoints[key] !== undefined) {
            return acc;
          }

          // variants without a known attribute are considered classes for the element
          if(key != 'class' && knownAttributes.indexOf(key) < 0) {
            values.unshift(key);
            key = 'class';
          }

          const value = values.join('-');
          if (acc[key] && Array.isArray(acc[key])) {
            acc[key].push(value);
          } else if (acc[key]) {
            acc[key] = [acc[key], value];
          } else {
            acc[key] = value;
          }
          return acc;
        }, {}),
      ...mediaParams,
    };
  }

  async setupElement() {
    const element = document.createElement(this.webComponentName);
    element.append(...this.block.children);
    const params = this.loadParams()
    Object.keys(params).forEach((key) => {
      const value = Array.isArray(params[key])
        ? params[key].join(' ')
        : params[key];
      element.setAttribute(key, value);
    });
    const initialized = new Promise((resolve) => {
      const initListener = (event) => {
        if(event.detail.block === element) {
          element.removeEventListener('initialized', initListener);
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
            cssLoaded = this.loadCSS(this.cssPath).catch(() =>
              // eslint-disable-next-line no-console
              console.trace(`${this.cssPath} does not exist`),
            );
            const mod = await import(this.jsPath);
            this.handler = mod.default;
            if(this.isWebComponentClass(mod.default)) {
              customElements.define(this.webComponentName, this.handler);
            }
            resolve(mod.default);
          } catch(e) {
            reject(e);
          }
        });
      }
      await this.handler;
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
