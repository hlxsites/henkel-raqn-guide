import component from './init.js';
import {
  globalConfig,
  getBreakPoints,
  listenBreakpointChange,
  camelCaseAttr,
  capitalizeCaseAttr,
  deepMerge,
  classToFlat,
  unflat,
  isObject,
  flatAsValue,
  flat,
} from './libs.js';
import { externalConfig } from './libs/external-config.js';

export default class ComponentBase extends HTMLElement {
  // All supported data attributes must be added to observedAttributes
  // The order of observedAttributes is the order in which the values from config are added.
  static observedAttributes = [];

  static loaderConfig = {
    targetsSelectorsPrefix: null,
    targetsSelectors: null,
    selectorTest: null, // a function to filter elements matched by targetsSelectors
    targetsSelectorsLimit: null,
    targetsAsContainers: false,
    loaderStopInit() {
      return false;
    },
  };

  get Handler() {
    return window.raqnComponents[this.componentName];
  }

  get isInitAsBlock() {
    return this.initOptions?.target?.classList?.contains(this.componentName);
  }

  constructor() {
    super();
    this.setDefaults();
    this.setInitializationPromise();
    this.extendConfigRunner({ config: 'config', method: 'extendConfig' });
    this.extendConfigRunner({ config: 'nestedComponentsConfig', method: 'extendNestedConfig' });
    this.setBinds();
  }

  setDefaults() {
    this.uuid = `gen${crypto.randomUUID().split('-')[0]}`;
    this.webComponentName = this.tagName.toLowerCase();
    this.componentName = this.webComponentName.replace(/^raqn-/, '');
    this.overrideExternalConfig = false;
    this.wasInitBeforeConnected = false;
    this.fragmentPath = null;
    this.fragmentCache = 'default';
    this.dependencies = [];
    this.attributesValues = {};
    this.initOptions = {};
    this.externalOptions = {};
    this.elements = {};
    this.childComponents = {
      // using the nested feature
      nestedComponents: [],
      // from inner html blocks
      innerComponents: [],
    };
    this.innerBlocks = [];
    this.initError = null;
    this.breakpoints = getBreakPoints();

    // use the this.extendConfig() method to extend the default config
    this.config = {
      listenBreakpoints: false,
      hideOnInitError: true,
      hideOnChildrenError: false,
      addToTargetMethod: 'replaceWith',
      contentFromTargets: true,
      targetsAsContainers: {
        addToTargetMethod: 'replaceWith',
        contentFromTargets: true,
      },
    };

    // use the this.extendNestedConfig() method to extend the default config
    this.nestedComponentsConfig = {
      image: {
        componentName: 'image',
      },
      button: {
        componentName: 'button',
      },
    };
  }

  setInitializationPromise() {
    this.initialization = new Promise((resolve, reject) => {
      this.initResolvers = {
        resolve,
        reject,
      };
    });
    // Promise.withResolvers don't fullfill last 2 versions of Safari
    // eg this breaks everything in Safari < 17.4, we need to support.
    // const { promise, resolve, reject } = Promise.withResolvers();
  }

  // Using the `method` which returns an array of objects it's easier to extend
  // configs when the components are deeply extended with multiple levels of inheritance;
  extendConfigRunner({ config, method }) {
    const conf = this[method]?.();
    if (!conf.length) return;
    this[config] = deepMerge({}, ...conf);
  }

  extendConfig() {
    return [...(super.extendConfig?.() || []), this.config];
  }

  extendNestedConfig() {
    return [...(super.extendNestedConfig?.() || []), this.nestedComponentsConfig];
  }

  setBinds() {
    this.onBreakpointChange = this.onBreakpointChange.bind(this);
  }

  // ! Needs to be called after the element is created;
  async init(initOptions) {
    try {
      this.wasInitBeforeConnected = true;
      this.initOptions = initOptions || {};
      this.setInitialAttributesValues();
      await this.buildExternalConfig();
      this.runConfigsByViewport();
      this.addDefaultsToNestedConfig();
      // Add extra functionality to be run on init.
      await this.onInit();
      this.addContentFromTargetCheck();
      await this.connectComponent();
    } catch (error) {
      if (initOptions.throwInitError) {
        throw error;
      } else {
        // eslint-disable-next-line no-console
        console.error(`There was an error while initializing the '${this.componentName}' webComponent:`, this, error);
      }
    }
  }

  /**
   * When the element was created with data attributes before the ini() method is called
   * use the data attr values as default for attributesValues
   */
  setInitialAttributesValues() {
    const initialAttributesValues = { all: {} };

    this.Handler.observedAttributes.map((dataAttr) => {
      const [, key] = dataAttr.split('data-');
      const value = this.dataset[key];
      if (typeof value === 'undefined') return {};
      initialAttributesValues.all[key] = value;
      return initialAttributesValues;
    });

    this.attributesValues = deepMerge(
      {},
      this.attributesValues,
      this.initOptions?.attributesValues || {},
      initialAttributesValues,
    );
  }

  async connectComponent() {
    if (!this.initOptions.target) return this;
    const { targetsAsContainers } = this.initOptions.loaderConfig || {};
    const conf = this.config;
    const addToTargetMethod = targetsAsContainers ? conf.targetsAsContainers.addToTargetMethod : conf.addToTargetMethod;

    this.initOptions.target[addToTargetMethod](this);

    return this.initialization;
  }

  // Build-in method called after the element is added to the DOM.
  async connectedCallback() {
    // Common identifier for raqn web components
    this.setAttribute('raqnWebComponent', '');
    this.setAttribute('isloading', '');
    try {
      this.initialized = this.getAttribute('initialized');
      this.initSubscriptions(); // must subscribe each time the element is added to the document
      if (!this.initialized) {
        await this.initOnConnected();
        this.setAttribute('id', this.uuid);
        this.loadDependencies(); // do not wait for dependencies;
        await this.loadFragment(this.fragmentPath);
        await this.connected(); // manipulate/create the html
        await this.initChildComponents();
        this.addListeners(); // html is ready add listeners
        await this.ready(); // add extra functionality
        this.setAttribute('initialized', true);
        this.initialized = true;
        this.initResolvers.resolve(this);
        this.dispatchEvent(new CustomEvent(`initialized:${this.uuid}`, { detail: { element: this } }));
      }
    } catch (error) {
      this.initResolvers.reject(error);
      this.dispatchEvent(new CustomEvent(`initialized:${this.uuid}`, { detail: { error } }));
      this.initError = error;
      this.hideWithError(this.config.hideOnInitError, 'has-init-error');
      // eslint-disable-next-line no-console
      console.error(`There was an error after the '${this.componentName}' webComponent was connected:`, this, error);
    }
    this.removeAttribute('isloading');
  }

  // This allows for components to be initialized as a string by adding them to another element's innerHTML
  // The attributes `data-config-name` and `data-config-by-classes` can be used to set the config

  async initOnConnected() {
    if (this.wasInitBeforeConnected) return;
    this.setInitialAttributesValues();
    await this.buildExternalConfig();
    this.runConfigsByViewport();
    this.addDefaultsToNestedConfig();
    // Add extra functionality to be run on init.
    await this.onInit();
  }

  async buildExternalConfig() {
    let configByClasses = this.initOptions.configByClasses || [];
    // normalize the configByClasses to serializable format
    const { byName } = getBreakPoints();
    configByClasses = configByClasses
      // remove the first class which is the component name and keep only compound classes
      .filter((c, index) => c.includes('-') && index !== 0)
      // make sure break points are included in the config
      .map((c) => {
        const exceptions = ['all', 'config'];
        const firstClass = c.split('-')[0];
        const isBreakpoint = Object.keys(byName).includes(firstClass) || exceptions.includes(firstClass);
        return isBreakpoint ? c : `all-${c}`;
      });

    // serialize the configByClasses into a flat object
    let values = classToFlat(configByClasses);

    // get the external config

    const configs = unflat(await externalConfig.getConfig(this.componentName, values.config));

    if (!this.overrideExternalConfig) {
      values = deepMerge({}, configs, values);
    } else {
      values = deepMerge({}, configs, this.attributesValues, values);
    }
    delete values.config;

    // add to attributesValues
    this.attributesValues = deepMerge({}, this.attributesValues, values);
  }

  addDefaultsToNestedConfig() {
    Object.keys(this.nestedComponentsConfig).forEach((key) => {
      const defaults = {
        targets: [this],
        active: true,
        loaderConfig: {
          targetsAsContainers: true,
        },
      };
      this.nestedComponentsConfig[key] = deepMerge({}, defaults, this.nestedComponentsConfig[key]);
    });
  }

  addContentFromTargetCheck() {
    if (!this.initOptions.target) return;

    const { targetsAsContainers } = this.initOptions.loaderConfig;
    const {
      contentFromTargets,
      targetsAsContainers: { contentFromTargets: contentFromTargetsAsContainer },
    } = this.config;
    const getContent = targetsAsContainers ? contentFromTargetsAsContainer : contentFromTargets;

    if (!getContent) return;
    this.addContentFromTarget();
  }

  addContentFromTarget() {
    const { target } = this.initOptions;
    const { contentFromTargets } = this.config;
    if (!contentFromTargets) return;
    this.append(...target.childNodes);
  }

  onBreakpointChange(e) {
    if (e.matches) {
      this.runConfigsByViewport();
    }
  }

  runConfigsByViewport() {
    const { name } = getBreakPoints().active;
    const current = deepMerge({}, this.attributesValues.all, this.attributesValues[name]);
    this.className = '';
    Object.keys(current).forEach((key) => {
      const action = `apply${key.charAt(0).toUpperCase() + key.slice(1)}`;
      if (typeof this[action] === 'function') {
        return this[action]?.(current[key]);
      }
      return this.applyClass(current[key]);
    });
  }

  // ${viewport}-data-${attr}-"${value}"
  applyData(entries) {
    // received as {col:{ direction:2 }, columns: 2}
    const values = flat(entries);
    // transformed into values as {col-direction: 2, columns: 2}

    // Add only supported data attributes from observedAttributes;
    // Sometimes the order in which the attributes are set matters.
    // Control the order by using the order of the observedAttributes.
    this.Handler.observedAttributes.forEach((dataAttr) => {
      const [, key] = dataAttr.split('data-');
      const camelCaseAttribute = camelCaseAttr(key);

      if (typeof values[key] !== 'undefined') {
        this.dataset[camelCaseAttribute] = values[key];
      } else {
        delete this.dataset[camelCaseAttribute];
      }
    });
  }

  // ${viewport}-class-${value}
  applyClass(className) {
    // {'color':'primary', 'max':'width'} -> 'color-primary max-width'

    // classes can be serialized as a string or an object
    if (isObject(className)) {
      // if an object is passed, it's flat and splited
      this.classList.add(...flatAsValue(className).split(' '));
    } else {
      // strings are added as is
      this.setAttribute('class', className);
    }
  }

  // ${viewport}-attribute-${value}

  applyAttribute(entries) {
    // received as {col:{ direction:2 }, columns: 2}
    const values = flat(entries);
    // transformed into values as {col-direction: 2, columns: 2}
    Object.keys(values).forEach((key) => {
      // camelCaseAttr converst col-direction into colDirection
      this.setAttribute(key, values[key]);
    });
  }

  // ${viewport}-nest-${value}

  applyNest(config) {
    const names = Object.keys(config);
    names.map((key) => {
      const instance = document.createElement(`raqn-${key}`);
      instance.initOptions.configByClasses = [config[key]];

      this.cachedChildren = Array.from(this.initOptions.target.children);
      this.cachedChildren.forEach((child) => instance.append(child));
      this.append(instance);
    });
  }

  /**
   * Attributes are assigned before the `connectedCallback` is triggered.
   * In some cases a check for `this.initialized` inside `onAttribute${capitalizedAttr}Changed` might be required
   */
  attributeChangedCallback(name, oldValue, newValue) {
    try {
      const simpleName = name.replace(/^data-/, '');
      const camelAttr = camelCaseAttr(simpleName);
      const capitalizedAttr = capitalizeCaseAttr(simpleName);
      // handle case when attribute is removed from the element
      // default to attribute breakpoint value
      const defaultNewVal = newValue === null ? this.getBreakpointAttrVal(camelAttr) ?? null : newValue;
      this[`onAttribute${capitalizedAttr}Changed`]?.({ name, oldValue, newValue: defaultNewVal });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`There was an error while processing the '${name}' attribute change:`, this, error);
    }
  }

  getBreakpointAttrVal(attr) {
    const { name: activeBrName } = this.breakpoints.active;
    const attribute = this.attributesValues?.[attr];
    if (!attribute) return undefined;
    return attribute?.[activeBrName] ?? attribute?.all;
  }

  addListeners() {
    if (Object.keys(this.attributesValues).length > 1) {
      listenBreakpointChange(this.onBreakpointChange);
    }
  }

  async initChildComponents() {
    await Promise.allSettled([this.initNestedComponents(), this.initInnerBlocks()]);
  }

  async initNestedComponents() {
    if (!Object.keys(this.nestedComponentsConfig).length) return;
    const nestedSettings = Object.values(this.nestedComponentsConfig).flatMap((setting) => {
      if (!setting.active) return [];
      return this.innerBlocks.length
        ? deepMerge({}, setting, {
            // Exclude nested components query from innerBlocks. Inner Components will query their own nested components.
            loaderConfig: {
              targetsSelectorsPrefix: ':scope > div >', // Limit only to default content, exclude blocks.
            },
          })
        : setting;
    });

    this.childComponents.nestedComponents = await component.multiInit(nestedSettings);

    const { allInitialized } = this.childComponents.nestedComponents;
    const { hideOnChildrenError } = this.config;
    this.hideWithError(!allInitialized && hideOnChildrenError, 'has-nested-error');
  }

  async initInnerBlocks() {
    if (!this.innerBlocks.length) return;
    const innerBlocksSettings = this.innerBlocks.map((block) => ({ targets: [block] }));
    this.childComponents.innerComponents = await component.multiInit(innerBlocksSettings);

    const { allInitialized } = this.childComponents.innerComponents;
    const { hideOnChildrenError } = this.config;
    this.hideWithError(!allInitialized && hideOnChildrenError, 'has-inner-error');
  }

  async loadDependencies() {
    if (!this.dependencies.length) return;
    component.multiLoadAndDefine(this.dependencies);
  }

  async loadFragment(path) {
    if (typeof path !== 'string') return;
    const response = await this.getFragment(path);
    await this.processFragment(response);
  }

  getFragment(path) {
    return fetch(`${path}`, window.location.pathname.endsWith(path) ? { cache: this.fragmentCache } : {});
  }

  async processFragment(response) {
    if (response.ok) {
      this.fragmentContent = response.text();
      await this.addFragmentContent();
      this.setInnerBlocks();
    }
  }

  async addFragmentContent() {
    this.innerHTML = await this.fragmentContent;
  }

  setInnerBlocks() {
    this.innerBlocks = [...this.querySelectorAll(globalConfig.blockSelector)];
  }

  queryElements() {
    this.queryElemFromConfig(this.config.selectors, this);
  }

  queryElemFromConfig(selectorsObj, sourceElem) {
    if (selectorsObj) {
      Object.keys(selectorsObj).forEach((key) => {
        const query = `${selectorsObj[key]}`;
        let elements = Array.from(sourceElem.querySelectorAll(query));
        elements = elements.length === 1 ? elements.pop() : elements;
        this.elements[key] = elements.length === 0 ? false : elements;
      });
    }
  }

  hideWithError(check, statusAttr) {
    if (check) {
      this.classList.add('hide-with-error');
      this.setAttribute(statusAttr, '');
    }
  }

  initSubscriptions() {}

  onInit() {}

  connected() {}

  ready() {}

  disconnectedCallback() {}
}
