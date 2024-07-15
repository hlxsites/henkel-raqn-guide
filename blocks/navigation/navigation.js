import component from '../../scripts/init.js';
import ComponentBase from '../../scripts/component-base.js';
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
    this.navCompactedContentInit = false;
  }

  async ready() {
    this.navContent = this.querySelector('ul');
    this.innerHTML = '';
    this.navCompactedContent = this.navContent.cloneNode(true); // the clone need to be done before `this.navContent` is modified
    this.nav = document.createElement('nav');
    this.isCompact = this.dataset.compact === 'true';
    this.dataset.icon ??= 'menu';
    this.append(this.nav);
    this.nav.setAttribute('role', 'navigation');
    this.nav.setAttribute('id', 'navigation');

    if (this.isCompact) {
      await this.setupCompactedNav();
    } else {
      this.setupNav();
    }
  }

  setupNav() {
    if (!this.navContentInit) {
      this.navContentInit = true;
      this.setupClasses(this.navContent);
    }
    this.navButton?.remove();
    this.nav.append(this.navContent);
  }

  async setupCompactedNav() {
    if (!this.navCompactedContentInit) {
      this.navCompactedContentInit = true;
      await component.multiLoadAndDefine(['accordion', 'icon']);
      this.setupClasses(this.navCompactedContent, true);
      this.navCompactedContent.addEventListener('click', (e) => this.activate(e));
    }

    this.prepend(this.createButton());
    this.nav.append(this.navCompactedContent);
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

  createButton() {
    this.navButton = document.createElement('button');
    this.navButton.setAttribute('aria-label', 'Menu');
    this.navButton.setAttribute('aria-expanded', 'false');
    this.navButton.setAttribute('aria-controls', 'navigation');
    this.navButton.setAttribute('aria-haspopup', 'true');
    this.navButton.setAttribute('type', 'button');
    this.navButton.innerHTML = `<raqn-icon data-icon=${this.dataset.icon}></raqn-icon>`;
    this.navIcon = this.navButton.querySelector('raqn-icon');
    this.navButton.addEventListener('click', () => {
      this.isActive = !this.isActive;
      this.classList.toggle('active');
      this.navButton.setAttribute('aria-expanded', this.isActive);
      this.navIcon.dataset.active = this.isActive;
    });
    return this.navButton;
  }

  addIcon(elem) {
    component.init({
      componentName: 'icon',
      targets: [elem],
      configByClasses: 'icon-chevron-right',
      componentConfig: {
        addToTargetMethod: 'append',
      },
    });
  }

  createAccordion(elem) {
    component.init({
      componentName: 'accordion',
      targets: [elem],
      componentConfig: {
        addToTargetMethod: 'append',
      },
      nestedComponentsConfig: {
        button: { active: false },
      },
    });
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
