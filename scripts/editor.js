import { deepMerge, flat, getBaseUrl, loadModule } from './libs.js';
import { publish } from './pubsub.js';
import { generateVirtualDom } from './render/dom.js';

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

export function refresh(id) {
  Object.keys(window.raqnEditor).forEach((webComponentName) => {
    const instancesOrdered = Array.from(document.querySelectorAll(webComponentName));
    window.raqnComponents[webComponentName].instances = instancesOrdered;
    window.raqnEditor[webComponentName].instances = instancesOrdered.map((item) =>
      // eslint-disable-next-line no-use-before-define
      getComponentValues(window.raqnEditor[webComponentName].dialog, item),
    );
  });
  const bodyRect = window.document.body.getBoundingClientRect();
  publish(
    MessagesEvents.render,
    { components: window.raqnEditor, bodyRect, uuid: id },
    { usePostMessage: true, targetOrigin: '*' },
  );
}

export function updateComponent(component) {
  const { webComponentName, uuid } = component;
  const instance = window.raqnComponents[webComponentName].instances.find((element) => element.uuid === uuid);
  if (!instance) return;
  instance.attributesValues = deepMerge({}, instance.attributesValues, component.attributesValues);
  instance.runConfigsByViewport();
  refresh(uuid);
}

export function getComponentValues(dialog, element) {
  const html = element.innerHTML;
  window.document.body.style.height = 'auto';

  const domRect = element.getBoundingClientRect();
  let { variables = {}, attributes = {} } = dialog;
  variables = Object.keys(variables).reduce((data, variable) => {
    const value = getComputedStyle(element).getPropertyValue(variable);
    data[variable] = { ...variables[variable], value };
    return data;
  }, {});
  attributes = Object.keys(attributes).reduce((data, attribute) => {
    if (attribute === 'data') {
      const flatData = flat(element.dataset);
      Object.keys(flatData).forEach((key) => {
        const value = flatData[key];
        if (attributes[attribute] && attributes[attribute][key]) {
          if (data[attribute]) {
            const extend = { ...attributes[attribute][key], value };
            data[attribute][key] = extend;
          } else {
            data[attribute] = { [key]: { ...attributes[attribute][key], value } };
          }
        }
      });
      return data;
    }

    const value = element.getAttribute(attribute);
    data[attribute] = { ...attributes[attribute], value };
    return data;
  }, {});
  const cleanData = Object.fromEntries(Object.entries(element));
  const { attributesValues, webComponentName, componentName, uuid } = cleanData;
  const children = generateVirtualDom(element.children, false);
  const editor = { ...dialog, attributes };
  return { attributesValues, webComponentName, componentName, uuid, domRect, dialog, editor, html, children };
}

export default function initEditor(listeners = true) {
  Promise.all(
    Object.keys(window.raqnComponents).map(
      (componentName) =>
        new Promise((resolve) => {
          setTimeout(async () => {
            try {
              const fn = window.raqnComponents[componentName];
              const name = fn.name.toLowerCase();
              const component = loadModule(`/blocks/${name}/${name}.editor`, { loadCSS: false });
              const mod = await component.js;
              if (mod && mod.default) {
                const dialog = await mod.default();

                const masterConfig = window.raqnComponentsMasterConfig;
                const variations = masterConfig[componentName];
                dialog.selection = variations;
                window.raqnEditor[componentName] = { dialog, instances: [], name: componentName };
                const { webComponentName } = window.raqnInstances[componentName][0];
                const instancesOrdered = Array.from(document.querySelectorAll(webComponentName));
                window.raqnEditor[componentName].instances = instancesOrdered.map((item) =>
                  getComponentValues(dialog, item),
                );
              }
              resolve();
            } catch (error) {
              resolve();
            }
          });
        }),
    ),
  ).finally(() => {
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

    if (!watcher) {
      window.addEventListener('resize', () => {
        refresh();
      });
      watcher = true;
    }
  });
  if (listeners) {
    // init editor if message from parent
    window.addEventListener('message', async (e) => {
      if (e && e.data) {
        const { message, params } = e.data;
        switch (message) {
          case MessagesEvents.select:
            updateComponent(params);
            break;

          case MessagesEvents.updateComponent:
            updateComponent(params);
            break;

          default:
            break;
        }
      }
    });
  }
}
