import ComponentBase from '../../scripts/component-base.js';

const audiences = {
  viewport: {
    allValues: ['mobile', 'desktop'],
    currentValue: window.innerWidth < 768 ? 'mobile' : 'desktop',
  },
};

export default class Personalisation extends ComponentBase {

  connected() {
    const audience = this.querySelector('div > div').innerText?.toLowerCase() || '';
    if (audiences.viewport.allValues.includes(audience) && audiences.viewport.currentValue !== audience) {
      this.parentElement.classList.add('personalisation-hidden');
    }
    if(audience === 'split') {
      const sections = [...document.querySelectorAll(`.${this.classList[0]}`)]
        .filter(element => element.parentElement.dataset.personalisationInitialized !== 'true');
      const visibleIndex = Math.ceil((Math.random() * 1000)) % sections.length;
      sections.forEach((element, index) => {
        if(index !== visibleIndex) {
          element.parentElement.classList.add('personalisation-hidden');
        }
      });
    }
    this.parentElement.dataset.personalisationInitialized = 'true';
  }

}