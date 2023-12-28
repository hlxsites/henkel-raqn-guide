import { config } from './libs.js';

export default class ComponentLoader {
  constructor(blockName, element) {
    console.log('blockName', blockName, element);
    window.raqnComponents = window.raqnComponents || {};
    this.blockName = blockName;
    this.setBlockPaths();
    this.block = element;
    if (this.block) {
      this.setParams();
      this.content = this.block.children;
    }
  }

  /**
   * Loads a CSS file.
   * @param {string} href URL to the CSS file
   */
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

  /**
   * Parse extra params from classList
   */
  setParams() {
    const breakpoints = Object.keys(config.breakpoints);
    const mediaParams = {};
    this.params = {
      ...Array.from(this.block.classList)
        .filter((c) => c !== this.blockName && c !== 'block')
        .reduce((acc, c) => {
          const values = c.split('-');
          let key = values.shift();
          if (breakpoints.includes(key)) {
            if (
              !matchMedia(`(min-width: ${config.breakpoints[key]}px)`).matches
            ) {
              return acc;
            }
            key = values.shift();
            mediaParams[key] = mediaParams[key] || [];
            mediaParams[key].push(values.join('-'));
            return acc;
          }

          if (acc[key] && Array.isArray(acc[key])) {
            acc[key].push(values.join('-'));
          } else if (acc[key]) {
            acc[key] = [acc[key], values.join('-')];
          } else {
            acc[key] = values.join('-');
          }
          return acc;
        }, {}),
      ...mediaParams,
    };
    console.log('params', this.params);
    console.log('mediaParams', mediaParams);
  }

  /**
   * Set the configuration for the given block, and also passes
   * the config through all custom patching helpers added to the project.
   *
   * @param {Element} block The block element
   * @returns {Object} The block config (blockName, cssPath and jsPath)
   */
  setBlockPaths() {
    this.cssPath = `/blocks/${this.blockName}/${this.blockName}.css`;
    this.jsPath = `/blocks/${this.blockName}/${this.blockName}.js`;
    console.log('cssPath', this.cssPath);
    console.log('jsPath', this.jsPath);
  }

  setupElement() {
    const elementName = `raqn-${this.blockName.toLowerCase()}`;
    const element = document.createElement(elementName);
    element.append(...this.block.children);
    Object.keys(this.params).forEach((key) => {
      // @TODO sanitize
      const value = Array.isArray(this.params[key])
        ? this.params[key].join(' ')
        : this.params[key];
      element.setAttribute(key, value);
    });
    this.block.replaceWith(element);
  }

  async loadWebComponent() {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const mod = await import(this.jsPath);
          if (
            mod.default &&
            mod.default.name &&
            mod.default.name !== 'decorate'
          ) {
            const { name } = mod.default;
            const elementName = `raqn-${name.toLowerCase()}`;
            // define the custom element if it doesn't exist
            if (!window.raqnComponents[name]) {
              const Contructor = mod.default;
              customElements.define(elementName, Contructor);
              window.raqnComponents[name] = Contructor;
            }
            if (this.block) {
              this.setupElement();
            }
          } else if (mod.default) {
            await mod.default(this.block);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`failed to load module for ${this.blockName}`, error);
          return reject(error);
        }
        return resolve();
      })();
    });
  }

  async decorate() {
    if (window.raqnComponents[this.blockName]) {
      return this.setupElement();
    }
    try {
      const cssLoaded = this.loadCSS(this.cssPath);
      const decorationComplete = this.loadWebComponent();
      return Promise.all([cssLoaded, decorationComplete]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`failed to load module for ${this.blockName}`, error);
      return Promise.resolve();
    }
  }
}
