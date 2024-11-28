import { blockBodyScroll, loadAndDefine } from '../../scripts/libs.js';
import { componentList } from '../../scripts/component-list/component-list.js';
import ComponentBase from '../../scripts/component-base.js';

export default class Navigation extends ComponentBase {
  static observedAttributes = ['data-menu-icon', 'data-item-icon', 'data-compact'];

  active = {};

  isActive = false;

  navContentInit = false;

  navCompactedContentInit = false;

  attributesValues = {
    all: {
      data: {
        'menu-icon': 'menu__close',
        'item-icon': 'chevron-right',
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

  async init() {
    super.init();
    this.elements.navContent = this.querySelector('ul');
    this.innerHTML = '';
    this.elements.navCompactedContent = this.elements.navContent.cloneNode(true); // the clone need to be done before `this.navContent` is modified
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
      this.setupClasses(this.elements.navContent);
    }
    this.nav.append(this.elements.navContent);
  }

  async setupCompactedNav() {
    const { navCompactedContent } = this.elements;

    if (!this.navCompactedContentInit) {
      loadAndDefine(componentList.accordion);
      this.navCompactedContentInit = true;
      this.setupClasses(navCompactedContent, true);
    }
    this.prepend(this.createButton());
    this.nav.append(navCompactedContent);
    this.addCompactedListeners();
  }

  onAttributeCompactChanged({ oldValue, newValue }) {
    if (!this.initialized) return;
    if (oldValue === newValue) return;
    this.isCompact = newValue === 'true';
    this.nav.innerHTML = '';

    if (this.isCompact) {
      this.setupCompactedNav();
    } else {
      this.cleanCompactedNav();
      this.setupNav();
    }
  }

  onAttributeIconChanged({ newValue }) {
    if (!this.initialized) return;
    if (!this.isCompact) return;
    this.navIcon.dataset.icon = newValue;
  }

  createButton() {
    this.elements.navButton = document.createElement('button');
    const { navButton } = this.elements;
    navButton.setAttribute('aria-label', 'Menu');
    navButton.setAttribute('aria-expanded', 'false');
    navButton.setAttribute('aria-controls', 'navigation');
    navButton.setAttribute('aria-haspopup', 'true');
    navButton.setAttribute('type', 'button');
    navButton.innerHTML = `<raqn-icon data-icon=${this.dataset.menuIcon}></raqn-icon>`;
    this.elements.navIcon = navButton.querySelector('raqn-icon');
    return navButton;
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

  addCompactedListeners() {
    const { navCompactedContent, navButton } = this.elements;
    navCompactedContent.addEventListener('click', (e) => this.activate(e));
    navButton.addEventListener('click', (e) => this.toggleNav(e));
  }

  toggleNav() {
    const { navIcon, navButton } = this.elements;
    this.isActive = !this.isActive;
    this.classList.toggle('active');
    navButton.setAttribute('aria-expanded', this.isActive);
    navIcon.dataset.active = this.isActive;
    blockBodyScroll(this.isActive);
    this.closeAllLevels();
  }

  cleanCompactedNav() {
    if (!this.navCompactedContentInit) return;
    const { navIcon, navButton } = this.elements;

    this.isActive = false;
    this.classList.remove('active');
    navButton.removeAttribute('aria-expanded');
    navIcon.dataset.active = this.isActive;
    this.closeAllLevels();
    navButton.remove();
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
      const activeElem = this.active[whileCurrentLevel];
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
