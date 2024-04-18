import { collectAttributes, loadModule, deepMerge, mergeUniqueArrays } from './libs.js';
// import ComponentBase from './component-base.js';

import ComponentMixin from './component-mixin.js';

export default class ComponentLoader {
  constructor({ componentName, targets = [], loaderConfig, rawClasses, config, nestedComponentsConfig, active }) {
    window.raqnComponents ??= {};
    if (!componentName) {
      // eslint-disable-next-line no-console
      console.error('`componentName` is required');
      return;
    }
    this.componentName = componentName;
    this.targets = targets.map((target) => ({ target }));
    this.loaderConfig = loaderConfig;
    this.rawClasses = rawClasses?.trim?.().split?.(' ') || [];
    this.config = config;
    this.nestedComponentsConfig = nestedComponentsConfig;
    this.pathWithoutExtension = `/blocks/${this.componentName}/${this.componentName}`;
    this.isWebComponent = null;
    this.isClass = null;
    this.isFn = null;
    this.active = active;
  }

  get Handler() {
    return window.raqnComponents[this.componentName];
  }

  set Handler(handler) {
    window.raqnComponents[this.componentName] = handler;
  }

  setHandlerType(handler = this.Handler) {
    this.isWebComponent = handler.prototype instanceof HTMLElement;
    this.isClass = !this.isWebComponent && handler.toString().startsWith('class');
    this.isFn = !this.isWebComponent && !this.isClass && typeof handler === 'function';
  }

  get webComponentName() {
    return `raqn-${this.componentName.toLowerCase()}`;
  }

  async init() {
    if (this.active === false) return null;
    if (!this.componentName) return null;
    const loaded = await this.loadAndDefine();
    if (!loaded) return null;
    this.setHandlerType();
    if (await this.Handler?.earlyStopRender?.()) return this.Handler;
    if (!this.targets?.length) return this.Handler;

    this.setTargets();
    return Promise.all(
      this.targets.map(async (target) => {
        const data = this.getTargetData(target);
        if (this.isWebComponent) {
          const elem = await this.createElementAndConfigure(data);
          data.componentElem = elem;
          this.addContentFromTarget(data);
          await this.connectComponent(data);
          return elem;
        }

        if (this.isClass) {
          return new this.Handler({
            componentName: this.componentName,
            ...data,
          });
        }

        if (this.isFn) {
          return this.Handler(data);
        }
        return null;
      }),
    );
  }

  getTargetData({ target, container }) {
    return {
      target,
      container,
      rawClasses: !container ? mergeUniqueArrays(this.rawClasses, target.classList) : this.rawClasses,
      // content: target?.childNodes,
    };
  }

  setTargets() {
    this.loaderConfig = deepMerge({}, this.Handler.loaderConfig, this.loaderConfig);
    const { targetsSelectorsPrefix, targetsSelectors, targetsSelectorsLimit, targetsAsContainers, selectorTest } =
      this.loaderConfig;
    const selector = `${targetsSelectorsPrefix || ''} ${targetsSelectors}`;
    if (targetsAsContainers) {
      this.targets = this.targets.flatMap(({ target: container }) => {
        const targetsFromContainer = this.getTargets(container, selector, selectorTest, targetsSelectorsLimit);
        return targetsFromContainer.map((target) => ({
          target,
          container,
        }));
      });
    }
  }

  getTargets(container, selector, selectorTest, length = 1) {
    const queryType = length && length <= 1 ? 'querySelector' : 'querySelectorAll';
    let elements = container[queryType](selector);

    if (length === null) elements = [...elements];
    if (length > 1) elements = [...elements].slice(0, length);
    if (length === 1) elements = [elements];

    if (typeof selectorTest === 'function') {
      elements = elements.filter((el) => selectorTest(el));
    }

    return elements;
  }

  async createElementAndConfigure(data) {
    const componentElem = document.createElement(this.webComponentName);

    componentElem.componentName = this.componentName;
    componentElem.webComponentName = this.webComponentName;
    componentElem.config = deepMerge({}, componentElem.config, this.config);
    const { nestedComponentsConfig } = componentElem;
    const { currentAttributes, nestedComponents } = collectAttributes(
      this.componentName,
      data.rawClasses,
      await ComponentMixin.getMixins(),
      this?.Handler?.knownAttributes,
      componentElem,
    );

    Object.keys(currentAttributes).forEach((key) => {
      componentElem.setAttribute(key, currentAttributes[key]);
    });

    componentElem.nestedComponentsConfig = deepMerge(
      componentElem.nestedComponentsConfig,
      this.nestedComponentsConfig,
      nestedComponents,
    );

    Object.keys(nestedComponentsConfig).forEach((key) => {
      const defaults = {
        targets: [componentElem],
        active: true,
        loaderConfig: {
          targetsAsContainers: true,
        },
      };
      nestedComponentsConfig[key] = deepMerge(defaults, nestedComponentsConfig[key]);
    });

    return componentElem;
  }

  addContentFromTarget(data) {
    const { componentElem, target } = data;
    const { contentFromTargets } = componentElem.config;
    if (!contentFromTargets) return;

    componentElem.append(...target.children);
  }

  async connectComponent(data) {
    const { componentElem } = data;
    componentElem.setAttribute('isloading', '');
    const initialized = new Promise((resolve) => {
      const initListener = async (event) => {
        if (event.detail.element === componentElem) {
          componentElem.removeEventListener('initialized', initListener);
          await ComponentMixin.startAll(componentElem);
          componentElem.removeAttribute('isloading');
          resolve(componentElem);
        }
      };
      componentElem.addEventListener('initialized', initListener);
    });
    const { targetsAsContainers } = this.loaderConfig;
    const conf = componentElem.config;
    const addToTargetMethod = targetsAsContainers ? conf.targetsAsContainers.addToTargetMethod : conf.addToTargetMethod;
    data.target[addToTargetMethod](componentElem);

    return initialized;
  }

  async loadAndDefine() {
    try {
      let cssLoaded = Promise.resolve();
      if (!this.Handler) {
        this.Handler = (async () => {
          const { css, js } = loadModule(this.pathWithoutExtension);
          cssLoaded = css;
          const mod = await js;
          if (mod.default.prototype instanceof HTMLElement) {
            window.customElements.define(this.webComponentName, mod.default);
          }
          return mod.default;
        })();
      }
      this.Handler = await this.Handler;
      await cssLoaded;
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`failed to load module for ${this.componentName}`, error);
      return false;
    }
  }
}
