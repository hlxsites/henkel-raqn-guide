import { start, startBlock } from './init.js';
import { getBreakPoints, listenBreakpointChange, camelCaseAttr, capitalizeCaseAttr } from './libs.js';

export default class ComponentBase extends HTMLElement {
  static get knownAttributes() {
    return [...(Object.getPrototypeOf(this).knownAttributes || []), ...(this.observedAttributes || [])];
  }

  constructor() {
    super();
    this.blockName = null; // set by component loader
    this.webComponentName = null; // set by component loader
    this.fragment = false;
    this.dependencies = [];
    this.breakpoints = getBreakPoints();
    this.uuid = `gen${crypto.randomUUID().split('-')[0]}`;
    this.attributesValues = {}; // the values are set by the component loader
    this.config = {};
    this.setBinds();
  }

  setBinds() {
    this.onBreakpointChange = this.onBreakpointChange.bind(this);
  }

  onBreakpointChange(e) {
    if (e.matches) {
      this.setBreakpointAttributesValues(e);
    }
  }

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
      if (this.fragment) {
        await this.loadFragment(this.fragment);
      }
      if (this.dependencies.length > 0) {
        await Promise.all(this.dependencies.map((dep) => start({ name: dep })));
      }
      this.connected(); // manipulate the html
      this.addListeners(); // html is ready add listeners
      this.ready(); // add extra functionality
      this.setAttribute('initialized', true);
      this.initialized = true;
      this.dispatchEvent(new CustomEvent('initialized', { detail: { block: this } }));
    }
  }

  async loadFragment(path) {
    const response = await fetch(`${path}`, window.location.pathname.endsWith(path) ? { cache: 'reload' } : {});
    return this.processFragment(response);
  }

  async processFragment(response) {
    if (response.ok) {
      const html = await response.text();
      this.innerHTML = html;
      return this.querySelectorAll(':scope > div > div').forEach((block) => startBlock(block));
    }
    return response;
  }

  initSubscriptions() {}

  connected() {}

  ready() {}

  disconnectedCallback() {}
}
