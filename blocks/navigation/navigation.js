import component from '../../scripts/init.js';
import ComponentBase from '../../scripts/component-base.js';

export default class Navigation extends ComponentBase {
  static observedAttributes = ['icon', 'compact'];

  static loaderConfig = {
    ...ComponentBase.loaderConfig,
    targetsSelectors: ':scope > :is(:first-child)',
  };

  // extendConfig() {
  //   return [
  //     ...super.extendConfig(),
  //     {
  //       targetsAsContainers: {
  //         addToTargetMethod: 'append',
  //       },
  //     },
  //   ];
  // }

  /* nestedComponentsConfig = {
    columns: {
      componentName: 'columns',
      // targets: [this],
      active: false,
      loaderConfig: {
        targetsAsContainers: false,
      },
    },
  }; */

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
    // this.navButton.setAttribute('tabindex', '0');
    this.navButton.innerHTML = '<raqn-icon icon=menu></raqn-icon>';
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

    this.icon = this.getAttribute('icon') || 'menu';

    this.isCompact = this.getAttribute('compact') === 'true';

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
      await Promise.all([component.init({ componentName: 'accordion' }), component.init({ componentName: 'icon' })]);

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

  createAccordion(replaceChildrenElement) {
    component.init({
      componentName: 'accordion',
      targets: [replaceChildrenElement],
      config: {
        addToTargetMethod: 'append',
      },
    });

    // const accordion = document.createElement('raqn-accordion');
    // const children = Array.from(replaceChildrenElement.children);
    // accordion.append(...children);
    // replaceChildrenElement.append(accordion);
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
          anchor.append(this.createIcon('chevron-right'));
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
