import { loadModule } from './libs.js';
import { publish } from './pubsub.js';

let origin = null;
let target = null;

window.raqnEditors = window.raqnEditors || {};

export function updateComponent(params) {
  const { uuid, name, option } = params;
  const dialog = window.raqnEditors[name];
  const component = window.raqnInstances[name].find((item) => item.componentElem.uuid === uuid);
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
  const bodyRect = window.document.body.getBoundingClientRect();
  // eslint-disable-next-line no-use-before-define
  const instance = getComponentValues(dialog, component);
  // eslint-disable-next-line no-use-before-define
  initEditor(origin, target, false);
  publish('editor:rendered', { instance, dialog, bodyRect }, { usePostMessage: true, targetOrigin: '*' });
}

export function getComponentValues(dialog, item) {
  const domRect = item.componentElem.getBoundingClientRect();
  console.log('dialog.variables', dialog.variables, item.componentElem);
  dialog.variables = Object.keys(dialog.variables).reduce((data, variable) => {
    const value = getComputedStyle(item.componentElem).getPropertyValue(variable);
    console.log('value', data);
    data[variable] = { ...dialog.variables[variable], value };
    console.log('value', data);
    return data;
  }, {});
  const cleanData = Object.fromEntries(Object.entries(item.componentElem));
  delete cleanData.nestedComponents;
  delete cleanData.nestedComponentsConfig;
  return { ...cleanData, domRect };
}

export default function initEditor(o, t, listeners = true) {
  origin = o;
  target = t;

  Object.keys(window.raqnComponents).forEach(async (componentName) => {
    try {
      const editor = await loadModule(`/blocks/${componentName}/${componentName}.editor`, false);
      const mod = await editor.js;

      if (mod && mod.default) {
        const dialog = mod.default();
        window.raqnEditors[componentName] = dialog;
        const instances = window.raqnInstances[componentName].map((item) => getComponentValues(dialog, item));

        const bodyRect = window.document.body.getBoundingClientRect();

        publish(
          'editor:loaded',
          { componentName, dialog, instances, bodyRect },
          {
            usePostMessage: true,
            targetOrigin: '*',
          },
        );
      }
    } catch (error) {
      //   console.log(error);
    }
  });
  if (listeners) {
    // init editor if message from parent
    window.addEventListener('message', async (e) => {
      if (e && e.data) {
        const { message, params } = e.data;
        switch (message) {
          case 'editor:select':
            updateComponent(params);
            break;

          default:
            break;
        }
      }
    });
  }
}
