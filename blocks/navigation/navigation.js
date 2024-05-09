import component from '../../scripts/init.js';
import ComponentBase from '../../scripts/component-base.js';

export default class Navigation extends ComponentBase {
  static observedAttributes = ['data-icon', 'data-compact'];

  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    targetsSelectors: ':scope > :is(:first-child)',
  };

  attributesValues = {
    compact: {
      xs: 'true',
      s: 'true',
      m: 'true',
      all: 'false',
    },
  };

  createButton() {
    this.navButton = document.createElement('button');
    this.navButton.setAttribute('aria-label', 'Menu');
    this.navButton.setAttribute('aria-expanded', 'false');
    this.navButton.setAttribute('aria-controls', 'navigation');
    this.navButton.setAttribute('aria-haspopup', 'true');
    this.navButton.setAttribute('type', 'button');
    this.navButton.innerHTML = '<raqn-icon data-icon=menu></raqn-icon>';
    this.navButton.addEventListener('click', () => {
      this.classList.toggle('active');
      this.navButton.setAttribute('aria-expanded', this.classList.contains('active'));
    });
    return this.navButton;
  }

  async ready() {
    this.active = {};
    this.navContent = this.querySelector('ul');
    this.innerHTML = '';
    this.navContentInit = false;
    this.navCompactedContent = this.navContent.cloneNode(true); // the clone need to be done before `this.navContent` is modified
    this.navCompactedContentInit = false;
    this.nav = document.createElement('nav');
    this.append(this.nav);
    this.setAttribute('role', 'navigation');

    this.dataset.icon ??= 'menu';

    this.isCompact = this.dataset.compact === 'true';

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

    this.nav.append(this.navContent);
  }

  async setupCompactedNav() {
    if (!this.navCompactedContentInit) {
      this.navCompactedContentInit = true;
      await component.multiLoadAndDefine(['accordion', 'icon']);
      this.setupClasses(this.navCompactedContent, true);
      this.navCompactedContent.addEventListener('click', (e) => this.activate(e));
    }

    this.nav.append(this.createButton());
    this.nav.append(this.navCompactedContent);
  }

  onAttributeCompactChanged({ newValue }) {
    if (!this.initialized) return;
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

  createIcon(name = this.icon) {
    const icon = document.createElement('raqn-icon');
    icon.setAttribute('icon', name);
    return icon;
  }

  addIcon(elem) {
    component.init({
      componentName: 'icon',
      targets: [elem],
      rawClasses: 'icon-chevron-right',
      config: {
        addToTargetMethod: 'append',
      },
    });
  }

  createAccordion(elem) {
    component.init({
      componentName: 'accordion',
      targets: [elem],
      config: {
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
