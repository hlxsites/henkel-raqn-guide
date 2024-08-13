import Column from '../column/column.js';

export default class Navigation extends Column {
  static observedAttributes = ['data-icon', 'data-compact', ...Column.observedAttributes];

  static loaderConfig = {
    ...Column.loaderConfig,
  };

  dependencies = ['icon'];

  setDefaults() {
    super.setDefaults();
    this.active = {};
    this.isActive = false;
    this.navContentInit = false;
  }

  async ready() {
    this.navContent = this.querySelector('ul');
    this.innerHTML = '';
    this.nav = document.createElement('nav');
    this.isCompact = this.dataset.compact === 'true';
    this.dataset.icon ??= 'menu';
    this.append(this.nav);
    this.nav.setAttribute('role', 'navigation');
    this.nav.setAttribute('id', 'navigation');
  }

  setupNav() {
    this.setupClasses(this.navContent);
  }

  onAttributeCompactChanged({ oldValue, newValue }) {
    if (!this.initialized) return;
    if (oldValue === newValue) return;
    this.isCompact = newValue === 'true';
    this.nav.innerHTML = '';

    if (this.isCompact) {
      this.setupCompactedNav();
    } else {
      this.classList.remove('active');
      this.navButton?.removeAttribute('aria-expanded');
      this.setupNav();
    }
  }

  onAttributeIconChanged({ newValue }) {
    if (!this.initialized) return;
    if (!this.isCompact) return;
    this.navIcon.dataset.icon = newValue;
  }

  addIcon(elem) {
    const icon = document.createElement('raqn-icon');
    icon.dataset.icon = 'chevron-right';
    elem.append(icon);
  }

  createAccordion(elem) {
    const content = Array.from(elem.children);
    const accordion = document.createElement('heliux-accordion');
    accordion.append(...content);
    elem.append(accordion);
  }

  setupClasses(ul, isCompact, level = 1) {
    const children = Array.from(ul.children);

    children.forEach((child) => {
      const hasChildren = child.querySelector('ul');
      child.classList.add(`level-${level}`);
      child.dataset.level = level;

      if (hasChildren) {
        const anchor = child.querySelector('a');
        if (isCompact) {
          this.createAccordion(child);
        } else if (level === 1) {
          this.addIcon(anchor);
        }
        child.classList.add('has-children');
        this.setupClasses(hasChildren, isCompact, level + 1);
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
      this.setAttribute('active', level);
      this.active[level].classList.toggle('active');
    }
  }
}
