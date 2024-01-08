import { Column } from '../column/column.js';

export class Navigation extends Column {
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
      this.block.classList.toggle('active');
      button.setAttribute('aria-expanded', this.classList.contains('active'));
    });
    return button;
  }

  render() {
    console.log('this.block', this.block);
    this.list = this.block.querySelector('ul');
    this.nav = document.createElement('nav');
    this.nav.append(this.list);
    this.block.setAttribute('role', 'navigation');
    this.compact = true;
    this.icon = this.block.getAttribute('icon') || 'menu';
    if (this.compact) {
      this.nav.append(this.createButton());
    }
    this.block.firstChild.replaceWith(this.nav);
    this.setupClasses(this.list);
    this.block.addEventListener('click', (e) => this.activate(e));
  }

  setupClasses(ul, level = 1) {
    const children = Array.from(ul.children);
    children.forEach((child) => {
      child.classList.add(`level-${level}`);
      const hasChildren = child.querySelector('ul');
      if (hasChildren) {
        const anchor = child.querySelector('a');
        const icon = document.createElement('raqn-icon');
        icon.setAttribute('icon', 'chevron-right');
        anchor.append(icon);
        child.classList.add('has-children');
        this.setupClasses(hasChildren, level + 1);
      }
    });
  }

  activate(e) {
    if (e.target.tagName.toLowerCase() === 'a') {
      const current = e.target.closest('li');
      if (this.active && this.active !== current) {
        this.active.classList.remove('active');
      }
      this.active = current;
      this.active.classList.toggle('active');
    }
  }
}

export default async function (block) {
  await new Navigation(block);
}
