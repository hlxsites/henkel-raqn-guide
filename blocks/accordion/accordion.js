import Column from '../column/column.js';

export default class Accordion extends Column {
  ready() {
    this.setAttribute('role', 'navigation');
    console.log('no this.contentChildren.length',this.contentChildren,this.contentChildren.length);
    if (this.contentChildren.length === 0) {
      this.contentChildren = Array.from(this.children);
      console.log('this.contentChildren.length',this.contentChildren,this.contentChildren.length);
      this.contentChildren = this.contentChildren.map((child) => {
        const wrapper = document.createElement('div');
        wrapper.append(child);
        this.append(wrapper);
        return wrapper;
      });
    }
    this.setupControls(this.contentChildren.filter((child, ind) => ind % 2 === 0));
    this.setupContent(this.contentChildren.filter((child, ind) => ind % 2 === 1));
  }

  setupControls(controls) {
    controls.forEach((control,index) => {
      const icon = document.createElement('raqn-icon');
      icon.setAttribute('icon', 'chevron-right');
      const children = Array.from(control.children);
      if (children.length === 0) {
        const child = document.createElement('span');
        child.textContent = control.textContent;
        control.innerHTML = '';
        control.append(child);
      }
      control.children[0].append(icon);
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
      content.setAttribute('aria-hidden',true);
      content.classList.add('accordion-content');
      content.setAttribute('aria-labelledby', content.previousElementSibling.id);
    });
  }
}