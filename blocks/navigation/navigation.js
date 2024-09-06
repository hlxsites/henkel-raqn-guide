import component from '../../scripts/init.js';
import { blockBodyScroll } from '../../scripts/libs.js';
import Column from '../column/column.js';

export default class Navigation extends Column {
  static observedAttributes = ['data-menu-icon', 'data-item-icon', 'data-compact', ...Column.observedAttributes];

  dependencies = ['icon', 'accordion'];

  attributesValues = {
    all: {
      data: {
        menu: {
          icon: 'menu__close',
        },
        item: {
          icon: 'chevron-right',
        },
      },
    },
    m: {
      data: {
        compact: true,
      },
    },
    s: {
      data: {
        compact: true,
      },
    },
    xs: {
      data: {
        compact: true,
      },
    },
  };

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
      if (this.navButton) {
        this.isActive = false;
        this.classList.remove('active');
        this.navButton.removeAttribute('aria-expanded');
        this.navIcon.dataset.active = this.isActive;
        this.closeAllLevels();
      }
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
    this.navButton.innerHTML = `<raqn-icon data-icon=${this.dataset.menuIcon}></raqn-icon>`;
    this.navIcon = this.navButton.querySelector('raqn-icon');

    this.navButton.addEventListener('click', () => {
      this.isActive = !this.isActive;
      this.classList.toggle('active');
      this.navButton.setAttribute('aria-expanded', this.isActive);
      this.navIcon.dataset.active = this.isActive;
      blockBodyScroll(this.isActive);
      this.closeAllLevels();
    });

    return this.navButton;
  }

  addIcon(elem) {
    const icon = document.createElement('raqn-icon');
    icon.dataset.icon = this.dataset.itemIcon;
    elem.append(icon);
  }

  createAccordion(replaceChildrenElement) {
    const accordion = document.createElement('raqn-accordion');
    accordion.append(...replaceChildrenElement.childNodes);
    replaceChildrenElement.append(accordion);
  }

  setupClasses(ul, isCompact, level = 1) {
    const children = Array.from(ul.children);

    children.forEach(async (child) => {
      const hasChildren = child.querySelector('ul');
      child.classList.add(`level-${level}`);
      child.dataset.level = level;

      if (hasChildren) {
        if (isCompact) {
          this.createAccordion(child);
        } else if (level === 1) {
          const anchor = child.querySelector('a');

          this.addIcon(anchor);
        }
        child.classList.add('has-children');
        this.setupClasses(hasChildren, isCompact, level + 1);
      }
    });
  }

  activate(e) {
    if (e.target.tagName.toLowerCase() === 'raqn-icon' || e.target.closest('raqn-icon')) {
      e.preventDefault();

      const current = e.target.closest('li');
      const { level } = current.dataset;
      const currentLevel = Number(level);
      const activeLevel = Number(this.getAttribute('active'));
      const activeElem = this.active[currentLevel];
      const isCurrentLevel = activeElem && activeElem === current;
      const hasActiveChildren = currentLevel < activeLevel;

      if (!isCurrentLevel || hasActiveChildren) {
        const whileCurrentLevel = isCurrentLevel && hasActiveChildren ? currentLevel + 1 : currentLevel;
        this.closeLevels(activeLevel, whileCurrentLevel);
      }

      this.setAttribute('active', isCurrentLevel ? Math.max(0, currentLevel - 1) || '' : currentLevel);
      activeElem?.classList.toggle('active');
      this.active[currentLevel] = isCurrentLevel ? null : current;
    }
  }

  closeLevels(activeLevel, currentLevel = 1) {
    let whileCurrentLevel = currentLevel;
    while (whileCurrentLevel <= activeLevel) {
      const activeElem = this.active[currentLevel];

      activeElem.classList.remove('active');
      const accordion = activeElem.querySelector('raqn-accordion');
      const control = accordion.querySelector('.accordion-control');
      accordion.toggleControl(control);
      this.active[whileCurrentLevel] = null;
      whileCurrentLevel += 1;
    }
  }

  closeAllLevels() {
    const activeLevel = Number(this.getAttribute('active'));
    if (activeLevel) {
      this.closeLevels(activeLevel);
      this.removeAttribute('active');
    }
  }
}
