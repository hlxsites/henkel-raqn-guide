import {
  getBreakPoints,
  listenBreakpointChange,
  camelCaseAttr,
  capitalizeCase,
  capitalizeCaseAttr,
  isObject,
  deepMerge,
  deepMergeByType,
  stringToArray,
  mergeUniqueArrays,
  stringToJsVal,
  runTasks,
  loadAndDefine,
} from './libs.js';
import { componentList } from './component-list/component-list.js';
import { externalConfig } from './libs/external-config.js';
import { generateVirtualDom, renderVirtualDom } from './render/dom.js';
import { generalManipulation } from './render/dom-manipulations.js';

export default class ComponentBase extends HTMLElement {
  // All supported data attributes must be added to observedAttributes
  // The order of observedAttributes is the order in which the values from config are added.
  static observedAttributes = [];

  static dependencies; // dynamically added to each constructor in `loadDependencies()`

  initialization; // set as promise in constructor();

  initResolvers; // the resolvers for the initialization promise;

  initialized = false;

  uuid = `gen${crypto.randomUUID().split('-')[0]}`;

  webComponentName = this.tagName.toLowerCase();

  componentName = this.webComponentName.replace(/^raqn-/, '');

  overrideExternalConfig = false;

  virtualNode = null;

  fragmentPath = null;

  fragmentCache = 'default';

  // Settings which automatically react on breakpoints changes
  attributesValues = {}; // add defaults here if no external configId is provided

  currentAttrValues = {}; // The values for the current breakpoint. Set automatically.

  elements = {}; // references to other elements should be saved here

  initError = null;

  breakpoints = getBreakPoints();

  // All settings which are not in `attributesValues` which might require extension in extended components should be in the config.
  // Use the `extendConfig()` method to extend the config
  config = {
    addFragmentContentOnInit: true,
    hideOnInitError: true,
    listenBreakpoints: false,
    selectors: {},
    classes: {
      showLoader: 'show-loader',
    },
    subscriptions: {},
    publishes: {},
    dispatches: {
      initialized: (uuid) => `initialized:${uuid}`,
    },
    // All the component attributes which are not in the `observedAttributes`
    knownAttributes: {
      configId: 'config-id',
      isLoading: 'isloading',
      raqnwebcomponent: 'raqnwebcomponent',
    },
  };

  mergeMethods = {
    // Merge options for non object values in `attributesValues`
    forAttributesValues: {
      '**.class': (a, b) => mergeUniqueArrays(a, b),
    },
    forConfig: null,
  };

  dataAttributesKeys = this.constructor.observedAttributes.flatMap((data) => {
    if (!data.startsWith('data-')) return [];
    const [, noData] = data.split('data-');
    return { data, noData, noDataCamelCase: camelCaseAttr(noData) };
  });

  get configId() {
    return this.getAttribute(this.config.knownAttributes.configId);
  }

  constructor() {
    super();
    this.constructor.instancesRef ??= [];
    this.constructor.instancesRef.push(this);
    this.setInitializationPromise();
    this.setDefaults();
    this.setBinds();
    this.loadDependencies();
  }

  /**
   * Add any custom properties to the class with a default value or use class fields */
  setDefaults() {}

  setInitializationPromise() {
    this.initialization = new Promise((resolve, reject) => {
      this.initResolvers = {
        resolve,
        reject,
      };
    });
  }

  /**
   * Use this to bind any method to the class */
  setBinds() {
    this.onBreakpointChange = this.onBreakpointChange.bind(this);
  }

  loadDependencies() {
    if (this.constructor.dependencies) return;

    this.constructor.dependencies = componentList[this.componentName]?.module?.dependencies || [];
    this.constructor.dependencies.forEach((dependency) => {
      if (!componentList[dependency]?.module?.path) return;
      if (window.raqnComponents[this.webComponentName]) return;
      setTimeout(() => {
        loadAndDefine(componentList[dependency]);
      }, 0);
    });
  }

  // Build-in method called after the element is added to the DOM.
  async connectedCallback() {
    const { knownAttributes, hideOnInitError, dispatches } = this.config;
    // Common identifier for raqn web components
    this.setAttribute(knownAttributes.raqnwebcomponent, '');
    this.setAttribute(knownAttributes.isLoading, 'true');
    try {
      this.initSubscriptions(); // must subscribe each type the element is added to the document
      if (!this.initialized) {
        this.setAttribute('id', this.uuid);
        await this.onConnected();
        this.initialized = true;
        this.initResolvers.resolve(this);
        this.dispatchEvent(new CustomEvent(dispatches.initialized(this.uuid), { detail: { element: this } }));
      } else {
        await this.reConnected();
      }
    } catch (error) {
      this.initResolvers.reject(error);
      this.dispatchEvent(new CustomEvent(dispatches.initialized(this.uuid), { detail: { error } }));
      this.initError = error;
      this.hideWithError(hideOnInitError, 'has-init-error');
      // eslint-disable-next-line no-console
      console.error(`There was an error after the '${this.componentName}' webComponent was connected:`, this, error);
    }
    this.removeAttribute(knownAttributes.isLoading);
  }

  /**
   * Do not overwrite this method unless absolutely needed. */
  async onConnected() {
    await runTasks.call(
      this,
      null,
      this.initSettings,
      async function loadFragment() {
        await this.loadFragment(this.fragmentPath);
      },
      this.init,
    );
  }

  /**
   * Use this method to add the component's functionality
   * If the functionality can generate long blocking tasks consider using runTasks() */
  async init() {
    this.queryElements();
    await this.addListeners();
  }

  async initSettings() {
    await runTasks.call(
      this,
      null,
      function extendConfig() {
        this.extendConfigRunner({ field: 'mergeMethods', method: 'extendMergeMethods' });
        this.extendConfigRunner({ field: 'config', method: 'extendConfig' });
      },
      this.setInitialAttributesValues,
      this.buildExternalConfig,
      this.runConfigsByViewport, // set the values for current breakpoint
    );
  }

  // Using the `method` which returns an array of objects it's easier to extend
  // configs when the components are deeply extended with multiple levels of inheritance;
  extendConfigRunner({ field, method }) {
    const conf = this[method]?.();
    if (conf.length <= 1) return;
    this[field] = deepMergeByType(this.mergeMethods.forConfig, {}, ...conf);
  }

  extendMergeMethods() {
    return [...(super.mergeMethods?.() || []), this.mergeMethods];
  }

  extendConfig() {
    return [...(super.extendConfig?.() || []), this.config];
  }

  setInitialAttributesValues() {
    const initialAttributesValues = {};

    this.classList.remove(this.componentName);
    const classes = [...this.classList];
    const { byName } = this.breakpoints;
    this.removeAttribute('class');

    /** Add any class prefixed with a breakpoint to `attributesValues`
     * Classes without a prefix will be added to the element and
     * not handled by `attributesValues` functionality */
    classes.reduce((acc, cls) => {
      const isBreakpoint = ['all', ...Object.keys(byName)].includes(cls.split('-')[0]);
      if (!isBreakpoint) return this.classList.add(cls) || acc;

      const [breakpoint, ...partCls] = cls.split('-');
      if (partCls[0] === 'class') partCls.shift();
      acc[breakpoint] ??= {};
      acc[breakpoint].class ??= [];
      acc[breakpoint].class.push(partCls.join('-'));

      return acc;
    }, initialAttributesValues);

    /**
     * When the element was created with data attributes
     * use the values as default for attributesValues.all */
    this.dataAttributesKeys.forEach(({ noData, noDataCamelCase }) => {
      const value = this.dataset[noDataCamelCase];

      if (typeof value === 'undefined') return;
      const initialValue = { [noData]: value };
      initialAttributesValues.all ??= { data: {} };
      initialAttributesValues.all.data = deepMerge({}, initialAttributesValues.all.data, initialValue);
    });

    this.attributesValues = deepMergeByType(
      this.mergeMethods.forAttributesValues,
      {},
      this.attributesValues,
      initialAttributesValues,
    );
  }

  async buildExternalConfig() {
    const extConfig = await externalConfig.getConfig(this.componentName, this.configId);
    /**
     * Any options which are not required to use `attributeChangedCallback`
     * with different values per breakpoint should be added to this.config */
    const configExternal = extConfig.config;
    if (configExternal) {
      delete extConfig.config;
      deepMergeByType(this.mergeMethods.forConfig, {}, this.config, configExternal);
    }

    // turn classes to array
    Object.values(extConfig).forEach((value) => {
      if (typeof value.class === 'string') {
        value.class = stringToArray(value.class, { divider: ' ' });
      }
    });

    const toMerge = [this.attributesValues, extConfig];

    if (this.overrideExternalConfig) toMerge.reverse();

    this.attributesValues = deepMergeByType(this.config.attributesMergeMethods, {}, ...toMerge);
  }

  currentAttributesValues() {
    const { name } = this.breakpoints.active;
    const currentAttrValues = deepMergeByType(
      this.config.attributesMergeMethods,
      {},
      this.attributesValues.all,
      this.attributesValues[name],
    );
    this.currentAttrValues = currentAttrValues;
    return currentAttrValues;
  }

  runConfigsByViewport() {
    const oldValues = this.currentAttrValues;
    const newValues = this.currentAttributesValues();
    const keysArray = mergeUniqueArrays(Object.keys(oldValues), Object.keys(newValues));

    keysArray.forEach((key) => {
      const action = `apply${capitalizeCase(key)}`;
      if (typeof this[action] === 'function') {
        this[action]?.({ oldValue: oldValues[key], newValue: newValues[key] });
      }
    });
  }

  applyData({ oldValue, newValue }) {
    // Add only supported data attributes from observedAttributes;
    // Sometimes the order in which the attributes are set matters.
    // Control the order by using the order of the observedAttributes.
    this.dataAttributesKeys.forEach(({ noData, noDataCamelCase }) => {
      const hasNewVal = typeof newValue?.[noData] !== 'undefined';
      // delete only when needed to minimize the times the attributeChangedCallback is triggered;
      if (typeof oldValue?.[noData] !== 'undefined' && !hasNewVal) {
        delete this.dataset[noDataCamelCase];
      }
      if (hasNewVal) {
        this.dataset[noDataCamelCase] = newValue[noData];
      }
    });
  }

  applyClass({ oldValue, newValue }) {
    if (oldValue === newValue) return;
    if (Array.isArray(newValue)) this.classList.add(...newValue);
    if (typeof newValue === 'string' && newValue.includes(' ')) this.classList.add(...newValue.split(' '));
    if (oldValue?.length) this.classList.remove(...oldValue);
    if (newValue?.length) this.classList.add(newValue);
  }

  applyAttribute({ oldValue, newValue }) {
    [oldValue, newValue].forEach((value, i) => {
      if (!isObject(value)) return;
      const isOld = i === 0;
      const addRemove = isOld ? 'removeAttribute' : 'setAttribute';

      Object.keys(value).forEach((key) => {
        if (isOld && typeof newValue?.[key] !== 'undefined') return;
        this[addRemove](key, value[key]);
      });
    });
  }

  applyStyle({ oldValue, newValue }) {
    [oldValue, newValue].forEach((value, i) => {
      if (!isObject(value)) return;
      const isOld = i === 0;
      const addRemove = isOld ? 'removeProperty' : 'setProperty';

      Object.keys(value).forEach((key) => {
        if (isOld && typeof newValue?.[key] !== 'undefined') return;
        this.style[addRemove](key, value[key]);
      });
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

  // to add a loading spinner for the component add 'isloading' attribute to the `observedAttributes`
  onAttributeIsloadingChanged({ oldValue, newValue }) {
    if (oldValue === newValue) return;
    this.classList.toggle(this.config.classes.showLoader, stringToJsVal(newValue) || false);
  }

  getBreakpointAttrVal(attr) {
    const { name: activeBrName } = this.breakpoints.active;
    const attribute = this.attributesValues?.[attr];
    if (!attribute) return undefined;
    return attribute?.[activeBrName] ?? attribute?.all;
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
      await runTasks.call(
        this,
        null,
        this.fragmentVirtualDom,
        this.fragmentVirtualDomManipulation,
        this.renderFragment,
        this.addFragmentContent,
      );
    }
  }
  /*
   async addFragmentContent() {
    await runTasks.call(
      this,
      null,
      function fragmentVirtualDom() {
        const placeholder = document.createElement('div');
        placeholder.innerHTML = this.fragmentContent;
        const virtualDom = generateVirtualDom(placeholder);
        virtualDom.isRoot = true;
        this.innerHTML = '';
        return virtualDom;
      },
      // eslint-disable-next-line prefer-arrow-callback
      async function fragmentVirtualDomManipulation({ fragmentVirtualDom }) {
        await generalManipulation(fragmentVirtualDom);
      },
      function renderFragment({ fragmentVirtualDom }) {
        console.log(fragmentVirtualDom);
        this.append(...fragmentVirtualDom.children.map(dom => renderVirtualDom(dom)));
      },
    );
  */
  fragmentVirtualDom() {
    const element = document.createElement('div');
    element.innerHTML = this.fragmentContent;
    return generateVirtualDom(element.childNodes);
  }

  async fragmentVirtualDomManipulation({ fragmentVirtualDom }) {
    await generalManipulation(fragmentVirtualDom);
  }

  renderFragment({ fragmentVirtualDom }) {
    this.fragmentContent = renderVirtualDom(fragmentVirtualDom);
    return { stopTaskRun: !this.config.addFragmentContentOnInit };
  }

  addFragmentContent() {
    this.append(...this.fragmentContent);
  }

  addListeners() {
    if (Object.keys(this.attributesValues).length >= 1) {
      listenBreakpointChange(this.onBreakpointChange);
    }
  }

  onBreakpointChange(e) {
    if (e.matches) {
      this.runConfigsByViewport();
    }
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

  removeSubscriptions() {}

  removeListeners() {}

  reConnected() {}

  disconnectedCallback() {
    this.removeSubscriptions();
    this.removeListeners();
  }
}
