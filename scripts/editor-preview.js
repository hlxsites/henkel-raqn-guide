import ComponentLoader from './component-loader.js';
import { publish } from './pubsub.js';

export default async function preview(component, classes, uuid) {
  const { componentName } = component;
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const main = document.querySelector('main');
  main.innerHTML = '';

  main.classList.add(classes);
  if (header) {
    header.parentNode.removeChild(header);
  }
  if (footer) {
    footer.parentNode.removeChild(footer);
  }
  const el = document.createElement('div');
  const { attributesValues } = component;
  if (typeof attributesValues.class === 'string') {
    el.classList.add(...attributesValues.class.split(' '));
  }
  el.innerHTML = component.innerHTML;

  if (component.attributesValues.attributes) {
    Object.keys(component.attributesValues.attributes).forEach((attr) => {
      el.setAttribute(attr, component.attributesValues.attributes[attr]);
    });
  }
  const loader = new ComponentLoader({ componentName, targets: [el] });
  loader.init();
  main.innerHTML = `<div>${component.html}</div>`;
  document.body.style.display = 'block';

  window.addEventListener(
    'click',
    (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    true,
  );

  setTimeout(() => {
    const webComponent = main.querySelector(component.webComponentName);
    webComponent.style.display = 'inline-grid';
    webComponent.style.width = 'auto';
    const bodyRect = webComponent.getBoundingClientRect();
    publish('raqn:editor:preview:render', { bodyRect, uuid }, { usePostMessage: true, targetOrigin: '*' });
  }, 200);
}
