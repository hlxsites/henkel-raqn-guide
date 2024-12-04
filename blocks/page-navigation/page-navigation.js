import ComponentBase from '../../scripts/component-base.js';

export default class PageNavigation extends ComponentBase {
  static observedAttributes = [];

  clicked = false;

  elements = {
    activeAnchor: null,
  };

  extendConfig() {
    return [
      ...super.extendConfig(),
      {
        selectors: {
          navAnchors: 'li > a[href]',
        },
        classes: {
          active: 'active',
        },
      },
    ];
  }

  setBinds() {
    this.highlightAnchor = this.highlightAnchor.bind(this);
  }

  init() {
    super.init();
    this.buildHeadingSelectors();
    this.queryPageElements();
    this.addObserver();
  }

  addListeners() {
    super.addListeners();
    this.addEventListener('click', this.highlightAnchor);
  }

  highlightAnchor(e) {
    if (e.target.tagName === 'A') {
      const { active } = this.config.classes;
      e.target.classList.add(active);
      if (e.target !== this.elements.activeAnchor) {
        this.elements.activeAnchor?.classList.remove(active);
      }
      this.elements.activeAnchor = e.target;
      this.clicked = true;
    }
  }

  buildHeadingSelectors() {
    const { pageSelectors } = this.config;

    pageSelectors.headings = this.elements.navAnchors.map((anchor) => anchor.href.match(/#.*$/)).join(', ');
  }

  addObserver() {
    const headingObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((observed) => {
          const currentAnchor = this.elements.navAnchors.find((anchor) => anchor.href.endsWith(observed.target.id));

          if (observed.isIntersecting) {
            if (!this.clicked) {
              const { active } = this.config.classes;

              currentAnchor?.classList.add(active);
              if (currentAnchor !== this.elements.activeAnchor) {
                this.elements.activeAnchor?.classList.remove(active);
                this.elements.activeAnchor = currentAnchor;
              }
            }
            if (currentAnchor === this.elements.activeAnchor) {
              this.clicked = false;
            }
          }
        });
      },
      {
        rootMargin: '0px 0px -45% 0px',
      },
    );
    this.elements.headings.forEach((heading) => {
      headingObserver.observe(heading);
    });
  }
}
