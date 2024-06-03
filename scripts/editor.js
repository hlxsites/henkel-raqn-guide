import { loadModule } from './libs.js';
import { publish } from './pubsub.js';

window.raqnEditor = window.raqnEditor || {};
let watcher = false;

export const MessagesEvents = {
  init: 'raqn:editor:start',
  loaded: 'raqn:editor:loaded',
  active: 'raqn:editor:active',
  disabled: 'raqn:editor:disabled',
  render: 'raqn:editor:render',
  select: 'raqn:editor:select',
};

export function refresh(id) {
  const bodyRect = window.document.body.getBoundingClientRect();
  Object.keys(window.raqnEditor).forEach((name) => {
    console.log('name', name);
    window.raqnEditor[name].instances = window.raqnInstances[name].map((item) =>
      // eslint-disable-next-line no-use-before-define
      getComponentValues(window.raqnEditor[name].dialog, item),
    );
  });

  publish(
    MessagesEvents.render,
    { components: window.raqnEditor, bodyRect, uuid: id },
    { usePostMessage: true, targetOrigin: '*' },
  );
}

export function updateComponent(params) {
  const { uuid, name, option } = params;
  // const dialog = window.raqnEditor[name];
  const component = window.raqnInstances[name].find((element) => element.uuid === uuid);
  const { componentElem } = component;
  const { variables, attributes } = option;
  if (variables) {
    Object.keys(variables).forEach((variable) => {
      componentElem.style.setProperty(variable, variables[variable]);
    });
  }
  if (attributes) {
    Object.keys(attributes).forEach((attribute) => {
      componentElem.setAttribute(attribute, attributes[attribute]);
    });
  }

  refresh(uuid);
}

export function getComponentValues(dialog, element) {
  const domRect = element.getBoundingClientRect();
  let { variables = {}, attributes = {} } = dialog;
  const { selection = {} } = dialog;
  variables = Object.keys(variables).reduce((data, variable) => {
    const value = getComputedStyle(element).getPropertyValue(variable);

    data[variable] = { ...variables[variable], value };

    return data;
  }, {});
  attributes = Object.keys(attributes).reduce((data, attribute) => {
    const value = element.getAttribute(attribute);

    data[attribute] = { ...attributes[attribute], value };
    return data;
  }, {});
  const cleanData = Object.fromEntries(Object.entries(element));
  delete cleanData.initOptions;
  delete cleanData.childComponents;
  delete cleanData.nestedComponents;
  delete cleanData.nestedComponentsConfig;
  return { ...cleanData, domRect, editor: { variables, attributes, selection } };
}

export default function initEditor(listeners = true) {
  Promise.all(
    Object.keys(window.raqnComponents).map(
      (componentName) =>
        new Promise((resolve) => {
          setTimeout(async () => {
            try {
              const component = await loadModule(`/blocks/${componentName}/${componentName}.editor`, false);
              const mod = await component.js;
              if (mod && mod.default) {
                const dialog = await mod.default();
                // available dialog and component instances
                window.raqnEditor[componentName] = { dialog, instances: [], name: componentName };
                window.raqnEditor[componentName].instances = window.raqnInstances[componentName].map((item) =>
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
      { components: window.raqnEditor, bodyRect },
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

          default:
            break;
        }
      }
    });
  }
}
