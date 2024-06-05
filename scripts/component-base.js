import component from './init.js';
import {
  getBreakPoints,
  listenBreakpointChange,
  camelCaseAttr,
  capitalizeCaseAttr,
  deepMerge,
  buildConfig,
} from './libs.js';

export default class ComponentBase extends HTMLElement {
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

  constructor() {
    super();
    this.setDefaults();
    this.extendConfigRunner({ config: 'config', method: 'extendConfig' });
    this.extendConfigRunner({ config: 'nestedComponentsConfig', method: 'extendNestedConfig' });
    this.setBinds();
  }

  setDefaults() {
    this.uuid = `gen${crypto.randomUUID().split('-')[0]}`;
    this.webComponentName = this.tagName.toLowerCase();
    this.componentName = this.webComponentName.replace(/^raqn-/, '');
    this.fragmentPath = null;
    this.dependencies = [];
    this.attributesValues = {};
    this.initOptions = {};
    this.externalOptions = {};
    this.childComponents = {
      // using the nested feature
      nestedComponents: [],
      // from inner html blocks
      innerComponents: [],
    };
    this.nestedComponents = [];
    this.innerBlocks = [];
    this.innerComponents = [];
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
      this.initOptions = initOptions || {};
      const { externalConfigName, configByClasses } = this.initOptions;

      this.externalOptions = await buildConfig(
        this.componentName,
        externalConfigName,
        configByClasses,
        this.Handler.observedAttributes,
      );

      this.mergeConfigs();
      this.setAttributesClassesAndProps();
      this.addDefaultsToNestedConfig();
      // Add extra functionality to be run on init.
      await this.onInit();
      this.addContentFromTarget();
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

  async connectComponent() {
    const { uuid } = this;
    if (!this.initOptions.target) return this;
    this.setAttribute('isloading', '');
    const initialized = new Promise((resolve, reject) => {
      const initListener = async (event) => {
        const { error } = event.detail;
        this.removeEventListener(`initialized:${uuid}`, initListener);
        this.removeAttribute('isloading');
        if (error) {
          reject(error);
        }
        resolve(this);
      };
      this.addEventListener(`initialized:${uuid}`, initListener);
    });
    const { targetsAsContainers } = this.initOptions.loaderConfig;
    const conf = this.config;
    const addToTargetMethod = targetsAsContainers ? conf.targetsAsContainers.addToTargetMethod : conf.addToTargetMethod;
    this.initOptions.target[addToTargetMethod](this);

    return initialized;
  }

  // Build-in method called after the element is added to the DOM.
  async connectedCallback() {
    try {
      this.initialized = this.getAttribute('initialized');
      this.initSubscriptions(); // must subscribe each time the element is added to the document
      if (!this.initialized) {
        this.setAttribute('id', this.uuid);
        this.loadDependencies(); // do not wait for dependencies;
        await this.loadFragment(this.fragmentPath);
        await this.connected(); // manipulate/create the html
        await this.initChildComponents();
        this.addListeners(); // html is ready add listeners
        await this.ready(); // add extra functionality
        this.setAttribute('initialized', true);
        this.initialized = true;
        this.dispatchEvent(new CustomEvent(`initialized:${this.uuid}`, { detail: { element: this } }));
      }
    } catch (error) {
      this.dispatchEvent(new CustomEvent(`initialized:${this.uuid}`, { detail: { error } }));
      this.initError = error;
      this.hideWithError(this.config.hideOnInitError, 'has-init-error');
      // eslint-disable-next-line no-console
      console.error(`There was an error after the '${this.componentName}' webComponent was connected:`, this, error);
    }
  }

  mergeConfigs() {
    this.initOptions.loaderConfig = deepMerge({}, this.Handler.loaderConfig, this.initOptions.loaderConfig);
    this.props = deepMerge({}, this.initOptions.props, this.externalOptions.props);

    this.config = deepMerge({}, this.config, this.initOptions.componentConfig, this.externalOptions.config);

    this.attributesValues = deepMerge(
      this.attributesValues,
      this.initOptions.attributesValues,
      this.externalOptions.attributesValues,
    );

    this.nestedComponentsConfig = deepMerge(
      this.nestedComponentsConfig,
      this.initOptions.nestedComponentsConfig,
      this.externalOptions.nestedComponentsConfig,
    );
  }

  setAttributesClassesAndProps() {
    Object.entries(this.props).forEach(([prop, value]) => {
      this[prop] = value;
    });
    // Set attributes based on attributesValues
    this.sortedAttributes.forEach(([attr, attrValues]) => {
      const isClass = attr === 'class';
      const val = attrValues[this.breakpoints.active.name] ?? attrValues.all;
      if (isClass) {
        const classes = (attrValues.all ? `${attrValues.all} ` : '') + (attrValues[this.breakpoints.active.name] ?? '');
        const classesArr = classes.split(' ').flatMap((cls) => {
          if (cls) return cls.trim();
          return [];
        });
        if (!classesArr.length) return;
        this.classList.add(...classesArr);
      } else {
        this.dataset[attr] = val;
      }
    });
  }

  get sortedAttributes() {
    const knownAttr = this.Handler.observedAttributes;
    // Sometimes the order in which the attributes are set matters.
    // Control the order by using the order of the observedAttributes.
    return Object.entries(this.attributesValues).sort(
      (a, b) => knownAttr.indexOf(`data-${a}`) - knownAttr.indexOf(`data-${b}`),
    );
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
      this.nestedComponentsConfig[key] = deepMerge(defaults, this.nestedComponentsConfig[key]);
    });
  }

  addContentFromTarget() {
    const { target } = this.initOptions;
    const { contentFromTargets } = this.config;
    if (!contentFromTargets) return;

    this.append(...target.childNodes);
  }

  onBreakpointChange(e) {
    if (e.matches) {
      this.setBreakpointAttributesValues(e);
    }
  }

  setBreakpointAttributesValues(e) {
    this.sortedAttributes.forEach(([attribute, breakpointsValues]) => {
      const isAttribute = attribute !== 'class';
      if (isAttribute) {
        const newValue = breakpointsValues[e.raqnBreakpoint.name] ?? breakpointsValues.all;
        // this will trigger the `attributeChangedCallback` and a `onAttribute${capitalizedAttr}Changed` method
        // should be defined to handle the attribute value change
        if (newValue ?? false) {
          if (this.dataset[attribute] === newValue) return;
          this.dataset[attribute] = newValue;
        } else {
          delete this.dataset[attribute];
        }
      } else {
        const prevClasses = (breakpointsValues[e.previousRaqnBreakpoint.name] ?? '').split(' ').filter((x) => x);
        const newClasses = (breakpointsValues[e.raqnBreakpoint.name] ?? '').split(' ').filter((x) => x);
        const removeClasses = prevClasses.filter((prevClass) => !newClasses.includes(prevClass));
        const addClasses = newClasses.filter((newClass) => !prevClasses.includes(newClass));

        if (removeClasses.length) this.classList.remove(...removeClasses);
        if (addClasses.length) this.classList.add(...addClasses);
      }
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
      this[`onAttribute${capitalizedAttr}Changed`]?.({ oldValue, newValue: defaultNewVal });
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
    if (this.externalOptions.hasBreakpointsValues || this.config.listenBreakpoints) {
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
    return fetch(`${path}`, window.location.pathname.endsWith(path) ? { cache: 'reload' } : {});
  }

  async processFragment(response) {
    if (response.ok) {
      const html = await response.text();
      this.innerHTML = html;

      this.innerBlocks = [...this.querySelectorAll('div[class]')];
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
