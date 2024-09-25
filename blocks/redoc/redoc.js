import ComponentBase from '../../scripts/component-base.js';

export default class RaqnRedoc extends ComponentBase {

  async ready() {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/blocks/redoc/libs/redoc.standalone.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    window.Redoc.init('/apis/PSS.json', {
      scrollYOffset: 110,
      disableSearch: true,
      hideTryItPanel: false,
    }, this);
  }

}
