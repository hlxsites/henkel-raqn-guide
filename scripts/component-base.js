import {
  getBreakPoints,
  listenBreakpointChange,
  camelCaseAttr,
  capitalizeCaseAttr,
  deepMerge,
  classToFlat,
  unFlat,
  isObject,
  flatAsValue,
  flat,
  mergeUniqueArrays,
} from './libs.js';
import { externalConfig } from './libs/external-config.js';
import { generalManipulation, generateDom, renderVirtualDom } from './render/dom.js';

export default class ComponentBase extends HTMLElement {
  // All supported data attributes must be added to observedAttributes
  // The order of observedAttributes is the order in which the values from config are added.
  static observedAttributes = [];

  dataAttributesKeys = [];

  uuid = `gen${crypto.randomUUID().split('-')[0]}`;

  webComponentName = this.tagName.toLowerCase();

  componentName = this.webComponentName.replace(/^raqn-/, '');

  overrideExternalConfig = false;

  wasInitBeforeConnected = false;

  fragmentPath = null;

  fragmentCache = 'default';

  dependencies = [];

  attributesValues = {};

  initOptions = {};

  externalOptions = {};

  elements = {};

  childComponents = {
    // using the nested feature
    nestedComponents: [],
    // from inner html blocks
    innerComponents: [],
    // from inner html blocks
    innerGrids: [],
  };

  // set only if content is loaded externally
  innerBlocks = [];

  // set only if content is loaded externally
  innerGrids = [];

  initError = null;

  breakpoints = getBreakPoints();

  // use the extendConfig() method to extend the default config
  config = {
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

  // use the extendNestedConfig() method to extend the default config
  nestedComponentsConfig = {
    image: {
      componentName: 'image',
    },
    button: {
      componentName: 'button',
    },
  };

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

  setDefaults() {}

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

  setDataAttributesKeys() {
    const { observedAttributes } = this.constructor;
    if (observedAttributes.length === 0) return [];
    this.dataAttributesKeys = observedAttributes.map((dataAttr) => {
      const [, key] = dataAttr.split('data-');
      if (!key) return {};

      return {
        data: dataAttr,
        noData: key,
        noDataCamelCase: camelCaseAttr(key),
      };
    });
    return this.dataAttributesKeys;
  }

  // ! Needs to be called after the element is created;
  async init(initOptions) {
    try {
      await this.Handler;
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
    const initial = [...this.classList];
    initial.unshift(); // remove the component name
    this.initialAttributesValues = classToFlat(initial.splice(1));
    const initialAttributesValues = this.initialAttributesValues || { all: { data: {} } };
    if (this.dataAttributesKeys && !this.dataAttributesKeys.length) {
      this.setDataAttributesKeys();
    } else {
      this.dataAttributesKeys = this.dataAttributesKeys || [];
    }
    this.dataAttributesKeys.forEach(({ noData, noDataCamelCase }) => {
      const value = this.dataset[noDataCamelCase];

      if (typeof value === 'undefined') return {};
      const initialValue = unFlat({ [noData]: value });
      if (initialAttributesValues.all && initialAttributesValues.all.data) {
        initialAttributesValues.all.data = deepMerge({}, initialAttributesValues.all.data, initialValue);
      }
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
      this.initSubscriptions(); // must subscribe each type the element is added to the document
      if (!this.initialized) {
        await this.initOnConnected();
        this.setAttribute('id', this.uuid);
        await this.loadFragment(this.fragmentPath);
        await this.connected(); // manipulate/create the html
        this.dataAttributesKeys = await this.setDataAttributesKeys();
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
    await this.Handler;
    this.setInitialAttributesValues();
    await this.buildExternalConfig();
    this.runConfigsByViewport();
    this.addDefaultsToNestedConfig();
    // Add extra functionality to be run on init.
    await this.onInit();
  }

  async buildExternalConfig() {
    let configByClasses = mergeUniqueArrays(this.initOptions.configByClasses, this.classList);
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
    // TODO With the unFlatten approach of setting this.attributesValues there is an increased amount of processing
    // each time a viewport changes when we need to flatten again the values
    // better approach would be to generate this.attributesValues in the final state needed by each time of data:
    // - class -  as arrays with unique values
    // - data - as flatten values with camel case keys
    // - attributes - as flatten values with hyphen separated keys.
    // for anything else set them flatten as they come from from external config
    const configs = unFlat(await externalConfig.getConfig(this.componentName, values.config));

    if (this.overrideExternalConfig) {
      // Used for preview functionality
      values = deepMerge({}, configs, this.attributesValues, values);
    } else {
      values = deepMerge({}, configs, values);
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
    this.removeAttribute('class');
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
    if (!this.dataAttributesKeys) {
      this.setDataAttributesKeys();
    }
    // Add only supported data attributes from observedAttributes;
    // Sometimes the order in which the attributes are set matters.
    // Control the order by using the order of the observedAttributes.
    this.dataAttributesKeys.forEach(({ noData, noDataCamelCase }) => {
      if (typeof values[noData] !== 'undefined') {
        this.dataset[noDataCamelCase] = values[noData];
      } else {
        delete this.dataset[noDataCamelCase];
      }
    });
  }

  // ${viewport}-class-${value}
  applyClass(className) {
    // {'color':'primary', 'max':'width'} -> 'color-primary max-width'

    // classes can be serialized as a string or an object
    if (isObject(className)) {
      // if an object is passed, it's flat and splitted
      this.classList.add(...flatAsValue(className).split(' '));
    } else if (className) {
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
      // camelCaseAttr converts col-direction into colDirection
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
      this.fragmentContent = await response.text();
      await this.addFragmentContent();
    }
  }

  async addFragmentContent() {
    const element = document.createElement('div');
    element.innerHTML = this.fragmentContent;
    this.append(...renderVirtualDom(generalManipulation(generateDom(element.childNodes))));
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
