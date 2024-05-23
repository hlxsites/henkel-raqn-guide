import { collectAttributes, loadModule, deepMerge, mergeUniqueArrays } from './libs.js';

window.raqnInstances = window.raqnInstances || {};

export default class ComponentLoader {
  constructor({ componentName, targets = [], loaderConfig, rawClasses, config, nestedComponentsConfig, active }) {
    window.raqnComponents ??= {};
    if (!componentName) {
      throw new Error('`componentName` is required');
    }
    this.instances = window.raqnInstances;
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
    if (this.active === false) return [];
    if (!this.componentName) return [];
    const { loaded, error } = await this.loadAndDefine();
    if (!loaded) throw new Error(error);
    this.setHandlerType();
    if (await this.Handler?.earlyStopRender?.()) return [];
    if (!this.targets?.length) return [];

    this.setTargets();
    return Promise.allSettled(
      this.targets.map(async (target) => {
        let returnVal = null;
        const data = this.getTargetData(target);
        if (this.isWebComponent) {
          returnVal = this.initWebComponent(data);
        }

        if (this.isClass) {
          returnVal = this.initClass(data);
        }

        if (this.isFn) {
          returnVal = this.initFn(data);
        }
        return returnVal;
      }),
    );
  }

  async initWebComponent(data) {
    let returnVal = null;
    try {
      const elem = await this.createElementAndConfigure(data);
      data.componentElem = elem;
      returnVal = elem;
      this.addContentFromTarget(data);
      const { componentElem } = await this.connectComponent(data);
      this.instances[componentElem.componentName] = this.instances[componentElem.componentName] || [];
      this.instances[componentElem.componentName].push(await this.connectComponent(data));
    } catch (error) {
      const err = new Error(error);
      err.elem = returnVal;
      // eslint-disable-next-line no-console
      console.error(
        `There was an error while initializing the '${this.componentName}' webComponent:`,
        returnVal,
        error,
      );
      throw err;
    }
    return returnVal;
  }

  async initClass(data) {
    try {
      return new this.Handler({
        componentName: this.componentName,
        ...data,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`There was an error while initializing the '${this.componentName}' class:`, data.target, error);
      throw error;
    }
  }

  async initFn(data) {
    try {
      return this.Handler(data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`There was an error while initializing the '${this.componentName}' function:`, data.target, error);
      throw error;
    }
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
      this?.Handler?.observedAttributes,
      componentElem,
    );

    Object.keys(currentAttributes).forEach((key) => {
      const attr = key === 'class' ? key : `data-${key}`;
      componentElem.setAttribute(attr, currentAttributes[key].trim());
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

    componentElem.append(...target.childNodes);
  }

  async connectComponent(data) {
    const { componentElem } = data;
    const { uuid } = componentElem;
    componentElem.setAttribute('isloading', '');
    const initialized = new Promise((resolve, reject) => {
      const initListener = async (event) => {
        const { error } = event.detail;
        componentElem.removeEventListener(`initialized:${uuid}`, initListener);
        componentElem.removeAttribute('isloading');
        if (error) {
          reject(error);
        }
        resolve(componentElem);
      };
      componentElem.addEventListener(`initialized:${uuid}`, initListener);
    });
    const { targetsAsContainers } = this.loaderConfig;
    const conf = componentElem.config;
    const addToTargetMethod = targetsAsContainers ? conf.targetsAsContainers.addToTargetMethod : conf.addToTargetMethod;
    data.target[addToTargetMethod](componentElem);

    return { initialized, componentElem };
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
      return { loaded: true };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load module for ${this.componentName}:`, error);
      return { loaded: false, error };
    }
  }
}
