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

  getParams(clazz) {
    const mediaParams = {};
    const knownAttributes = (clazz && clazz.knownAttributes) || [];
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

  setBlockPaths() {
    this.cssPath = `/blocks/${this.blockName}/${this.blockName}.css`;
    this.jsPath = `/blocks/${this.blockName}/${this.blockName}.js`;
  }

  setupElement() {
    const elementName = `raqn-${this.blockName.toLowerCase()}`;
    const element = document.createElement(elementName);
    element.append(...this.block.children);
    const params = this.getParams(window.raqnComponents[this.blockName])
    Object.keys(params).forEach((key) => {
      const value = Array.isArray(params[key])
        ? params[key].join(' ')
        : params[key];
      element.setAttribute(key, value);
    });
    this.block.replaceWith(element);
  }

  async loadWebComponent() {
    const mod = await import(this.jsPath);
    if (
      mod.default &&
      mod.default.toString().startsWith('class')
    ) {
      const { name } = mod.default;
      const elementName = `raqn-${name.toLowerCase()}`;
      // define the custom element if it doesn't exist
      if (!window.raqnComponents[this.blockName]) {
        const clazz = mod.default;
        customElements.define(elementName, clazz);
        window.raqnComponents[this.blockName] = clazz;
      }
      if (this.block) {
        this.setupElement();
      }
    // fallback in case we have a standard block
    } else if (mod.default) {
      await mod.default(this.block);
    }
  }

  async decorate() {
    if (window.raqnComponents[this.blockName]) {
      return this.setupElement();
    }
    try {
      const cssLoaded = this.loadCSS(this.cssPath).catch(() =>
        // eslint-disable-next-line no-console
        console.trace(`${this.cssPath} does not exist`),
      );
      const decorationComplete = this.loadWebComponent();
      Promise.all([decorationComplete, cssLoaded]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`failed to load module for ${this.blockName}`, error);
    }
  }
}
