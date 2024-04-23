import component from './init.js';

import { getBreakPoints, listenBreakpointChange, camelCaseAttr, capitalizeCaseAttr, deepMerge } from './libs.js';

export default class ComponentBase extends HTMLElement {
  static get knownAttributes() {
    return [...(Object.getPrototypeOf(this).knownAttributes || []), ...(this.observedAttributes || [])];
  }

  constructor() {
    super();
    this.componentName = null; // set by component loader
    this.webComponentName = null; // set by component loader
    this.fragment = false;
    this.dependencies = [];
    this.breakpoints = getBreakPoints();
    this.uuid = `gen${crypto.randomUUID().split('-')[0]}`;
    this.attributesValues = {}; // the values are set by the component loader
    this.setConfig('config', 'extendConfig');
    this.setConfig('nestedComponentsConfig', 'extendNestedConfig');
    this.setBinds();
  }

  static loaderConfig = {
    targetsSelectorsPrefix: null,
    targetsSelectors: null,
    selectorTest: null, // a function to filter elements matched by targetsSelectors
    targetsSelectorsLimit: null,
    targetsAsContainers: false,
  };

  static async earlyStopRender() {
    return false;
  }

  attributesValues = {}; // the values are set by the component loader

  config = {
    addToTargetMethod: 'replaceWith',
    contentFromTargets: true,
    targetsAsContainers: {
      addToTargetMethod: 'replaceWith',
    },
  };

  nestedComponentsConfig = {
    image: {
      componentName: 'image',
    },
    button: {
      componentName: 'button',
    },
    columns: {
      componentName: 'columns',
      active: false,
      loaderConfig: {
        targetsAsContainers: false,
      },
    },
  };

  setConfig(config, method) {
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

  onBreakpointChange(e) {
    if (e.matches) {
      this.setBreakpointAttributesValues(e);
    }
  }

  // TODO change to dataset attributes
  setBreakpointAttributesValues(e) {
    Object.entries(this.attributesValues).forEach(([attribute, breakpointsValues]) => {
      const isAttribute = attribute !== 'class';
      if (isAttribute) {
        const newValue = breakpointsValues[e.raqnBreakpoint.name] ?? breakpointsValues.all;
        // this will trigger the `attributeChangedCallback` and a `onAttribute${capitalizedAttr}Changed` method
        // should be defined to handle the attribute value change
        if (newValue ?? false) {
          if (this.getAttribute(attribute) === newValue) return;
          this.setAttribute(attribute, newValue);
        } else {
          this.removeAttribute(attribute, newValue);
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
    const camelAttr = camelCaseAttr(name);
    const capitalizedAttr = capitalizeCaseAttr(name);
    // handle case when attribute is removed from the element
    // default to attribute breakpoint value
    const defaultNewVal = newValue === null ? this.getBreakpointAttrVal(camelAttr) ?? null : newValue;
    this[`onAttribute${capitalizedAttr}Changed`]?.({ oldValue, newValue: defaultNewVal });
  }

  getBreakpointAttrVal(attr) {
    const { name: activeBrName } = this.breakpoints.active;
    const attribute = this.attributesValues?.[attr];
    if (!attribute) return undefined;
    return attribute?.[activeBrName] ?? attribute?.all;
  }

  addListeners() {
    listenBreakpointChange(this.onBreakpointChange);
  }

  async connectedCallback() {
    this.initialized = this.getAttribute('initialized');
    this.initSubscriptions(); // must subscribe each time the element is added to the document
    if (!this.initialized) {
      this.setAttribute('id', this.uuid);
      await Promise.all([this.loadFragment(this.fragment), this.loadDependencies()]);
      await this.connected(); // manipulate/create the html
      await this.initNestedComponents();
      this.addListeners(); // html is ready add listeners
      await this.ready(); // add extra functionality
      this.setAttribute('initialized', true);
      this.initialized = true;
      this.dispatchEvent(new CustomEvent('initialized', { detail: { element: this } }));
    }
  }

  async initNestedComponents() {
    const nested = await Promise.all(
      Object.values(this.nestedComponentsConfig).flatMap(async (setting) => {
        if (!setting.active) return [];
        const s = this.fragment
          ? deepMerge({}, setting, {
              // Content can contain blocks which are going to init their own nestedComponents.
              loaderConfig: {
                targetsSelectorsPrefix: ':scope > div >', // Limit only to default content, exclude blocks.
              },
            })
          : setting;
        return component.init(s);
      }),
    );
    this.nestedElements = nested.flat();
  }

  async loadDependencies() {
    if (!this.dependencies.length) return;
    await Promise.all(this.dependencies.map((dep) => component.loadAndDefine(dep)));
  }

  async loadFragment(path) {
    if (!path) return;
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
      await Promise.all([...this.querySelectorAll('div[class]')].map((block) => component.init({ targets: [block] })));
    }
  }

  initSubscriptions() {}

  connected() {}

  ready() {}

  disconnectedCallback() {}
}
