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
  theme: 'raqn:editor:theme',
  themeUpdate: 'raqn:editor:theme:update',
};

export function refresh(id) {
  Object.keys(window.raqnEditor).forEach((name) => {
    window.raqnEditor[name].instances = window.raqnInstances[name].map((item) =>
      // eslint-disable-next-line no-use-before-define
      getComponentValues(window.raqnEditor[name].dialog, item),
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
  const { componentName, uuid } = component;
  const instance = window.raqnInstances[componentName].find((element) => element.uuid === uuid);
  const { attributesValues } = instance;
  const attributes = component.attributesValues;
  // if (variables) {
  //   Object.keys(variables).forEach((variable) => {
  //     componentElem.style.setProperty(variable, variables[variable]);
  //   });
  // }
  if (attributes) {
    Object.keys(attributes).forEach((attribute) => {
      const val = attributes[attribute];
      if (attribute === 'class' && attributesValues[attribute]) {
        const classes = Array.from(instance.classList).filter((c) => !c.includes(val.split('-')[0] || 'color'));
        classes.push(...val.split(' '));
        const set = new Set(classes);
        instance.setAttribute(attribute, Array.from(set).join(' '));
      } else if (attribute === 'attributes' && attributes[attribute]) {
        Object.keys(val).forEach((attr) => {
          instance.setAttribute(attr, val[attr]);
        });
      } else {
        instance.setAttribute(attribute, val);
      }
    });
  }

  refresh(uuid);
}

export function getComponentValues(dialog, element) {
  const html = element.outerHTML;
  window.document.body.style.height = 'auto';
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
  return { ...cleanData, domRect, editor: { variables, attributes, selection }, html };
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
            console.log('select', params);
            updateComponent(params);
            break;

          default:
            break;
        }
      }
    });
  }
}
