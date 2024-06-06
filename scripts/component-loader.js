import { loadModule, deepMerge, mergeUniqueArrays, getBreakPoints } from './libs.js';

window.raqnInstances = window.raqnInstances || {};

export default class ComponentLoader {
  constructor({
    componentName,
    targets = [],
    loaderConfig,
    configByClasses,
    attributesValues,
    externalConfigName,
    componentConfig,
    props,
    nestedComponentsConfig,
    active,
  }) {
    window.raqnComponents ??= {};
    if (!componentName) {
      throw new Error('`componentName` is required');
    }
    this.instances = window.raqnInstances || {};
    this.componentName = componentName;
    this.targets = targets.map((target) => ({ target }));
    this.loaderConfig = loaderConfig;
    this.configByClasses = configByClasses?.trim?.().split?.(' ') || [];
    this.attributesValues = attributesValues;
    this.externalConfigName = externalConfigName;
    this.breakpoints = getBreakPoints();
    this.componentConfig = componentConfig;
    this.nestedComponentsConfig = nestedComponentsConfig;
    this.pathWithoutExtension = `/blocks/${this.componentName}/${this.componentName}`;
    this.props = props ?? {};
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
    if (!loaded) throw error;
    this.setHandlerType();
    this.loaderConfig = deepMerge({}, this.Handler.loaderConfig, this.loaderConfig);
    if (await this.loaderConfig?.loaderStopInit?.()) return [];
    if (!this.targets?.length) return [];

    this.setTargets();
    return Promise.allSettled(
      this.targets.map(async (targetData) => {
        let returnVal = null;
        const data = this.getInitData(targetData);
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
    let elem = null;
    try {
      elem = await this.createElementAndConfigure(data);
      elem.webComponentName = this.webComponentName;
      this.instances[elem.componentName] = this.instances[elem.componentName] || [];
      this.instances[elem.componentName].push(elem);
    } catch (error) {
      error.elem ??= elem;
      elem?.classList.add('hide-with-error');
      elem?.setAttribute('has-loader-error', '');
      // eslint-disable-next-line no-console
      console.error(
        `There was an error while initializing the '${this.componentName}' webComponent:`,
        error.elem,
        error,
      );
      throw error;
    }
    return elem;
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

  getInitData({ target, container }) {
    return {
      throwInitError: true,
      target,
      container,
      configByClasses: !container ? mergeUniqueArrays(this.configByClasses, target.classList) : this.configByClasses,
      props: this.props,
      componentConfig: this.componentConfig,
      externalConfigName: this.externalConfigName,
      attributesValues: this.attributesValues,
      nestedComponentsConfig: this.nestedComponentsConfig,
      loaderConfig: this.loaderConfig,
    };
  }

  setTargets() {
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
    this.componentElem = componentElem;
    try {
      await componentElem.init(data);
    } catch (error) {
      error.elem = componentElem;
      throw error;
    }
    return componentElem;
  }

  async loadAndDefine() {
    try {
      let cssLoaded = Promise.resolve();
      this.Handler ??= (async () => {
        const { css, js } = loadModule(this.pathWithoutExtension);
        cssLoaded = css;
        const mod = await js;
        if (mod.default.prototype instanceof HTMLElement) {
          window.customElements.define(this.webComponentName, mod.default);
        }
        return mod.default;
      })();
      this.Handler = await this.Handler;
      await cssLoaded;
      return { loaded: true };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load module for the '${this.componentName}' component:`, error);
      return { loaded: false, error };
    }
  }
}
