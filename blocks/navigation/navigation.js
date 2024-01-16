import { start } from '../../scripts/init.js';
import Column from '../column/column.js';

export default class Navigation extends Column {

  createButton() {
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Menu');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'navigation');
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('type', 'button');
    button.setAttribute('tabindex', '0');
    button.innerHTML = `<raqn-icon icon=menu></raqn-icon>`;
    button.addEventListener('click', () => {
      this.classList.toggle('active');
      button.setAttribute('aria-expanded', this.classList.contains('active'));
    });
    return button;
  }

  ready() {
    this.active = {};
    this.list = this.querySelector('ul');
    this.nav = document.createElement('nav');
    this.nav.append(this.list);
    this.setAttribute('role', 'navigation');
    this.compact = this.getAttribute('compact') === 'true' || false;
    this.icon = this.getAttribute('icon') || 'menu';
    if (this.compact) {
      this.nav.append(this.createButton());
      start({name:'accordion'});
    }
    this.append(this.nav);
    this.setupClasses(this.list);
    if (this.compact) {
      this.addEventListener('click', (e) => this.activate(e));
    }
  }

  createIcon(name = this.icon) {
    const icon = document.createElement('raqn-icon');
    icon.setAttribute('icon', name);
    return icon;
  }

  creaeteAccordion(replaceChildrenElement) {
    const accordion = document.createElement('raqn-accordion');
    const children = Array.from(replaceChildrenElement.children);
    accordion.append(...children);
    replaceChildrenElement.append(accordion);
  }

  setupClasses(ul, level = 1) {
    const children = Array.from(ul.children);
    children.forEach((child) => {
      const hasChildren = child.querySelector('ul');
      child.classList.add(`level-${level}`);
      child.dataset.level = level;

      if (hasChildren) {
        const anchor = child.querySelector('a');
        if (this.compact) {
          this.creaeteAccordion(child);
        } else if (level === 1) {
         anchor.append(this.createIcon('chevron-right'));
        }
        child.classList.add('has-children');
        this.setupClasses(hasChildren, level + 1);
      }
    });
  }

  activate(e) {
    e.preventDefault();
    if (e.target.tagName.toLowerCase() === 'a') {
      const current = e.target.closest('li');
      const { level } = current.dataset;
      if (this.active[level] && this.active[level] !== current) {
        this.active[level].classList.remove('active');
      }
      this.active[level] = current;
      this.setAttribute('active', level)
      this.active[level].classList.toggle('active');
    }
  }
}
