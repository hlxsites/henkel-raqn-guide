
import { createNode, generateVirtualDom, renderVirtualDom } from './render/dom.js';

import { publish, subscribe } from './pubsub.js';
import { generalManipulation } from './render/dom-manipulations.js';

export default {
  init() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentUUID = urlParams.get('previewOf');
    
    const main = document.querySelector('main');
    window.raqnVirtualDom = generateVirtualDom(main.childNodes);
    // wait to preview a specific component
    subscribe('raqn:editor:preview:component', async (params) => {
      const { component, uuid } = params;

      // @TODO virtual dom not usable anymore for this
      
      if (currentUUID === uuid) {
        const section  = createNode({
          tag: 'raqn-section',
        });
        const theme = createNode({
          tag: 'div',
          class: ['theming'],
          children: [],
        });
        
        document.body.innerHTML = '';
        window.raqnVirtualDom.children = [theme, section];
        const manipulation = await generalManipulation(window.raqnVirtualDom);
        document.body.append(...renderVirtualDom(manipulation));
        document.body.classList.add('color-default','font-default');
        setTimeout(async () => {
          const currentComponent = document.querySelector(`${component.webComponentName}`);
          currentComponent.attributesValues = component.attributesValues;
          currentComponent.runConfigsByViewport();
          const bodyRect = await document.body.getBoundingClientRect();
          publish('raqn:editor:preview:render', { bodyRect, uuid }, { usePostMessage: true, targetOrigin: '*' });
        }, 1000);
      }
    });

    publish('raqn:editor:preview:loaded', { uuid:currentUUID }, {
      usePostMessage: true,
      targetOrigin: '*',
    });
  },
}.init();
