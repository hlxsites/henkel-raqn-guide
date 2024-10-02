import component from './init.js';
import {
  getBreakPoints,
  listenBreakpointChange,
  camelCaseAttr,
  capitalizeCaseAttr,
  deepMerge,
  deepMergeMethod,
  classToFlat,
  unFlat,
  isObject,
  flatAsValue,
  flat,
  mergeUniqueArrays,
} from './libs.js';
import { externalConfig } from './libs/external-config.js';

window.raqnInstances ??= {};

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
    return window.raqnComponentsHandlers[this.componentName];
  }

  get isInitAsBlock() {
    return this.initOptions?.target?.classList?.contains(this.componentName);
  }

  constructor() {
    super();
    this.setDefaults();
    this.setInstance();
    this.setInitializationPromise();
    this.extendConfigRunner({ config: 'config', method: 'extendConfig' });
    this.extendConfigRunner({ config: 'nestedComponentsConfig', method: 'extendNestedConfig' });
    this.setBinds();
  }

  setDefaults() {
    this.uuid = `gen${crypto.randomUUID().split('-')[0]}`;
    this.webComponentName = this.tagName.toLowerCase();
    this.componentName = this.webComponentName.replace(/^raqn-/, '');
    this.externalConfig = null;
    this.overrideExternalConfig = false;
    this.category = null;
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
      // from inner html blocks
      innerGrids: [],
    };
    this.initializeInnerBlocks = true;
    this.innerBlocks = [];
    this.innerGrids = [];
    this.initError = null;
    this.breakpoints = getBreakPoints();
    this.dataAttributesKeys = this.setDataAttributesKeys();

    // use the this.extendConfig() method to extend the default config
    this.config = {
      innerComponents: undefined,
      nestedComponentsPrefix: ':scope > ',
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

    this.attrMerge = {
      '**.class': (a, b) => {
        const haveLength = [a, b].every((c) => c?.length);
        
        if (b && typeof a === 'string' && typeof b !== 'string') {
          console.error('Merge for css classes in attributeValues failed. Values are not strings');
          return a;
        }

        return haveLength ? `${a} ${b}` : b;
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

  setInstance() {
    window.raqnInstances[this.componentName] ??= [];
    window.raqnInstances[this.componentName].push(this);
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

  async setDataAttributesKeys() {
    const { observedAttributes } = await this.Handler;
    this.dataAttributesKeys = observedAttributes.map((dataAttr) => {
      const [, key] = dataAttr.split('data-');

      return {
        data: dataAttr,
        noData: key,
        noDataCamelCase: camelCaseAttr(key),
      };
    });
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
    const initialAttributesValues = {};

    this.externalConfigName = this.getAttribute('config-name') || this.initOptions.externalConfigName;

    this.dataAttributesKeys.forEach(({ noData, noDataCamelCase }) => {
      const value = this.dataset[noDataCamelCase];

      if (typeof value === 'undefined') return {};
      const initialValue = unFlat({ [noData]: value });
      initialAttributesValues.all ??= { data: {} };
      initialAttributesValues.all.data = deepMerge({}, initialAttributesValues.all.data, initialValue);
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
    this.setAttribute('raqnwebcomponent', '');
    this.setAttribute('isloading', '');
    try {
      this.initialized = this.getAttribute('initialized');
      this.initSubscriptions(); // must subscribe each type the element is added to the document
      if (!this.initialized) {
        await this.initOnConnected();
        this.setAttribute('id', this.uuid);
        this.loadDependencies(); // do not wait for dependencies;
        await this.loadFragment(this.fragmentPath);
        // Add, create and manipulate only html containing EDS blocks/markup
        // ! any element with a class will considered a block and transformed to a webComponent
        await this.addEDSHtml();
        this.setInnerBlocks();
        await this.initChildComponents();
        // Add, create and manipulate html after inner webComponents were initialized.
        // Here normal html or webComponent can be created and added to the component.
        await this.addHtml();
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
    let configByClasses = mergeUniqueArrays(
      this.initOptions.configByClasses?.filter((c, index) => c.includes('-') && index !== 0),
      [...this.classList].map((c) => `all-class-${c}`),
    );

    // normalize the configByClasses to serializable format
    const { byName } = this.breakpoints;
    configByClasses = configByClasses
      // remove the first class which is the component name and keep only compound classes
      // .filter((c, index) => c.includes('-') && index !== 0)
      // make sure break points are included in the config
      .map((c) => {
        const breakpoints = ['all', 'config', ...Object.keys(byName)];
        const firstClass = c.split('-')[0];
        const isBreakpoint = breakpoints.includes(firstClass);
        return isBreakpoint ? c : `all-${c}`;
      });

    const classesAndAttr = configByClasses.reduce(
      (acc, c) => {
        const breakpoints = ['all', ...Object.keys(byName)];
        const classBreakpoint = breakpoints.find((b) => c.startsWith(`${b}-class-`));

        if (c.startsWith('config-')) {
          // allows to have external config names with hyphens.
          acc.externalConfigName = c.slice('config-'.length);
        }

        if (classBreakpoint) {
          acc.classes[classBreakpoint] ??= {};
          const currentClasses = acc.classes[classBreakpoint].class;
          const cls = c.slice(`${classBreakpoint}-class-`.length);
          acc.classes[classBreakpoint].class = currentClasses?.length ? `${currentClasses} ${cls}` : cls;
        } else {
          acc.attrs.push(c);
        }
        return acc;
      },
      { classes: {}, attrs: [], externalConfigName: null },
    );

    // serialize the configByClasses into a flat object
    let values = deepMerge({}, classesAndAttr.classes, classToFlat(classesAndAttr.attrs));

    this.externalConfigName ??= classesAndAttr.externalConfigName;

    // get the external config
    // TODO With the unFlatten approach of setting this.attributesValues there is an increased amount of processing
    // each time a viewport changes when we need to flatten again the values
    // better approach would be to generate this.attributesValues in the final state needed by each time of data:
    // - class -  as arrays with unique values
    // - data - as flatten values with camel case keys
    // - attributes - as flatten values with hyphen separated keys.
    // for anything else set them flatten as they come from from external config
    const configs = unFlat(await externalConfig.getConfig(this.componentName, this.externalConfigName, this.category));

    if (this.overrideExternalConfig) {
      // Used for preview functionality
      values = deepMerge({}, configs, this.attributesValues, values);
    } else {
      values = deepMerge({}, configs, values);
    }

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
    const { name } = this.breakpoints.active;
    const current = deepMergeMethod(this.attrMerge, {}, this.attributesValues.all, this.attributesValues[name]);

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
      this.classList.add(...className.split(' '));
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

  applySetting(config) {
    // delete the setting to run only once on init
    delete this.attributesValues.all.setting;
    deepMerge(this.config, config);
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
    const attributeAll = this.attributesValues?.all?.[attr];
    const attributeBreakpoint = this.attributesValues?.[activeBrName]?.[attr];
    return attributeBreakpoint ?? attributeAll;
  }

  addListeners() {
    if (Object.keys(this.attributesValues).length > 1) {
      listenBreakpointChange(this.onBreakpointChange);
    }
  }

  async initChildComponents() {
    await Promise.allSettled([this.initNestedComponents(), this.initInnerBlocks()]);
    // await this.initInnerGrids();
  }

  async initNestedComponents() {
    if (!Object.keys(this.nestedComponentsConfig).length) return;
    const nestedSettings = Object.values(this.nestedComponentsConfig).flatMap((setting) => {
      if (!setting.active) return [];
      return this.innerBlocks.length
        ? deepMerge({}, setting, {
            // Exclude nested components query from innerBlocks. Inner Components will query their own nested components.
            loaderConfig: {
              targetsSelectorsPrefix: this.config.nestedComponentsPrefix, // Limit only to default content, exclude blocks.
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

    this.childComponents.innerComponents = await component.multiInit(this.innerBlocks);

    const { allInitialized } = this.childComponents.innerComponents;
    const { hideOnChildrenError } = this.config;
    this.hideWithError(!allInitialized && hideOnChildrenError, 'has-inner-error');
  }

  async initInnerGrids() {
    if (!this.innerGrids.length) return;

    this.childComponents.innerGrids = await component.multiSequentialInit(this.innerGrids);

    const { allInitialized } = this.childComponents.innerGrids;
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
      // When html is loaded externally it will contain sections and blocks
      // Initialize inner components
      this.config.innerComponents ??= ':scope > div';
    }
  }

  async addFragmentContent() {
    this.innerHTML = await this.fragmentContent;
  }

  setInnerBlocks() {
    if (!this.config.innerComponents) return;
    // const { blocks, grids } =
    //   ;

    this.innerBlocks = [...this.querySelectorAll(this.config.innerComponents)].map((elem) =>
      component.getBlockData(elem),
    );
    // this.innerGrids = grids;
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

  onInit() {}

  addEDSHtml() {}

  addHtml() {}

  ready() {}

  disconnectedCallback() {
    this.removeSubscriptions();
  }
}
