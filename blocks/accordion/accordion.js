import ComponentBase from '../../scripts/component-base.js';

export default class Accordion extends ComponentBase {
  init() {
    super.init();
    this.setAttribute('role', 'navigation');
    let children = Array.from(this.children);
    children = children.map((child) => {
      if (child.tagName !== 'DIV') {
        const div = document.createElement('div');
        div.append(child);
        this.append(div);
        return div;
      }
      return child;
    });

    this.setupControls(children.filter((_, ind) => ind % 2 === 0));
    this.setupContent(children.filter((_, ind) => ind % 2 === 1));
  }

  createIcon(elem) {
    const icon = document.createElement('raqn-icon');
    icon.dataset.icon = 'chevron-right';

    const hasIcon = elem?.querySelectorAll(`raqn-icon[data-icon="${icon.dataset.icon}"]`)?.length;
    if (!hasIcon) {
      elem.append(icon);
    }
  }

  setupControls(controls) {
    controls.forEach((control, index) => {
      const children = Array.from(control.children);
      if (children.length === 0) {
        const child = document.createElement('span');
        child.textContent = control.textContent;
        control.innerHTML = '';
        control.append(child);
      }
      this.createIcon(control.children[0]);
      control.setAttribute('role', 'button');
      control.setAttribute('aria-expanded', 'false');
      control.setAttribute('tabindex', '0');
      control.classList.add('accordion-control');
      control.id = `accordion-${this.id}-${index}`;
      control.addEventListener('click', () => this.toggleControl(control));
      control.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          this.toggleControl(control);
        }
      });
    });
  }

  toggleControl(control) {
    const content = control.nextElementSibling;
    if (content) {
      content.classList.toggle('active');
      control.classList.toggle('active');
      control.setAttribute('aria-expanded', content.classList.contains('active'));
      content.setAttribute('aria-hidden', !content.classList.contains('active'));
    }
  }

  setupContent(contents) {
    contents.forEach((content) => {
      const internal = content.children;
      const wrapper = document.createElement('div');
      wrapper.classList.add('accordion-content-wrapper');
      wrapper.append(...internal);
      content.append(wrapper);
      content.setAttribute('role', 'region');
      content.setAttribute('aria-hidden', true);
      content.classList.add('accordion-content');
      content.setAttribute('aria-labelledby', content.previousElementSibling.id);
    });
  }
}
