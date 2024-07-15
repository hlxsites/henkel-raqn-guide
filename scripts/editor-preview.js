import ComponentLoader from './component-loader.js';
import { deepMerge } from './libs.js';
import { publish } from './pubsub.js';

export default async function preview(component, classes, uuid) {
  console.log('preview', component, classes, uuid);
  const { componentName } = component;
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const main = document.querySelector('main');
  main.innerHTML = '';

  if (header) {
    header.parentNode.removeChild(header);
  }
  if (footer) {
    footer.parentNode.removeChild(footer);
  }
  const loader = new ComponentLoader({ componentName });
  await loader.init();
  const webComponent = document.createElement(component.webComponentName);
  webComponent.innerHTML = component.html;
  webComponent.attributesValues = deepMerge({}, webComponent.attributesValues, component.attributesValues);
  console.log(component.attributesValues, webComponent.attributesValues);
  main.appendChild(webComponent);

  window.addEventListener(
    'click',
    (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    true,
  );

  webComponent.style.display = 'inline-grid';
  webComponent.style.width = 'auto';
  webComponent.style.marginInlineStart = '0px';
  webComponent.runConfigsByViewport();
  document.body.style.setProperty('display', 'block');
  main.style.setProperty('display', 'block');
  setTimeout(() => {
    const bodyRect = webComponent.getBoundingClientRect();
    publish('raqn:editor:preview:render', { bodyRect, uuid }, { usePostMessage: true, targetOrigin: '*' });
  }, 100);
}
