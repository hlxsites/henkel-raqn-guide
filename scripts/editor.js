import { deepMerge, getBaseUrl, loadModule, runTasks } from './libs.js';
import { publish, subscribe } from './pubsub.js';
import { raqnComponents, raqnComponentsList } from './render/dom-reducers.js';
import { raqnInstances } from './render/dom.js';

window.raqnEditor = window.raqnEditor || {};

let watcher = false;

export const MessagesEvents = {
  init: 'raqn:editor:start',
  loaded: 'raqn:editor:loaded',
  active: 'raqn:editor:active',
  disabled: 'raqn:editor:disabled',
  render: 'raqn:editor:render',
  select: 'raqn:editor:select',
  updateComponent: 'raqn:editor:select:update',
  theme: 'raqn:editor:theme',
  themeUpdate: 'raqn:editor:theme:update',
};

export default {
  async init() {
    // no mods no party
    if (!this.mods().length) return;
    // inicial run tasks
    await runTasks.call(
      this,
      null,
      this.loadEditorModules,
      this.publishInit,
    );

    // update on resize
    if (!watcher) {
      window.addEventListener('resize', () => {
        this.refresh();
        this.sendUpdatedRender();
      });
      watcher = true;
    }
    subscribe(MessagesEvents.select, this.updateIntance.bind(this));
  },
  // alias to get all components
  mods: () => Object.keys(raqnComponents),
  // get values from component and sizes
  getComponentValues (dialog, element) {
    const {webComponentName} = element;
    const domRect = element.getBoundingClientRect();
    return {
      attributesValues: element.attributesValues,
      webComponentName,
      uuid: element.uuid,
      domRect,
      virtualNode: element.virtualNode?.toJSON(),
      dialog,
    };
  },
  // refresh all components
  refresh() {
    // this.mods().filter(k => window.raqnEditor[k]).forEach((k) => {
    //   this.refreshWebComponent(k);
    // });
    this.sendUpdatedRender();
  },
  // send updated to editor interface
  sendUpdatedRender(uuid) {
    const bodyRect = window.document.body.getBoundingClientRect();
    publish(
      MessagesEvents.render,
      { components: window.raqnEditor, bodyRect, uuid },
      { usePostMessage: true, targetOrigin: '*' },
    );
  },
  // refresh one type of web components
  refreshWebComponent(k) {
    console.log('refreshWebComponent', k);
    window.raqnEditor[k].instances = raqnInstances[k].map((item) =>
      this.getComponentValues(window.raqnEditor[k].dialog, item),
    );
  },
  // refresh one instance of web component
  updateIntance(component) {
    const { webComponentName, uuid } = component;
    const instance = raqnInstances[webComponentName].find((element) => element.uuid === uuid);
    console.log('updateIntance', component, instance);
    if (!instance) return;
    instance.attributesValues = deepMerge({}, instance.attributesValues, component.attributesValues);
    instance.runConfigsByViewport();
    this.refresh();
    this.sendUpdatedRender(uuid);
  },
  // publish update to editor
  publishInit() {
    const bodyRect = window.document.body.getBoundingClientRect();
    publish(
      MessagesEvents.loaded,
      {
        components: window.raqnEditor,
        bodyRect,
        baseURL: getBaseUrl(),
        masterConfig: window.raqnComponentsMasterConfig,
      },
      { usePostMessage: true, targetOrigin: '*' },
    );
  },
  /* load all editor modules */
  async loadEditorModules() {
    // check if all components are loaded and then init the editor
    await Promise.allSettled(this.mods().map((k) => new Promise((resolve) => {
      raqnComponents[k].then(async (contructor) => {
        const name = contructor.name.replace('raqn-', '').toLowerCase();
        if (raqnComponentsList[name] && raqnComponentsList[name].module && raqnComponentsList[name].module.editor) {
          const component = loadModule(`/blocks/${name}/${name}.editor`, { loadCSS: false });
          const mod = await component.js;
          if (mod && mod.default) {
            const dialog = await mod.default();
            const masterConfig = window.raqnComponentsMasterConfig;
            const variations = masterConfig[name];
            dialog.selection = variations;
            window.raqnEditor[k] = { dialog, instances: [], name };
            const instancesOrdered = Array.from(document.querySelectorAll(k));
            window.raqnEditor[k].instances = instancesOrdered.map((item) =>
              this.getComponentValues(dialog, item),
            );
          }
        }
        resolve();
      });
  })));
  },
}.init();