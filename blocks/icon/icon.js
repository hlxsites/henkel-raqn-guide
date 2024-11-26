import ComponentBase from '../../scripts/component-base.js';
import { stringToJsVal, getMeta, metaTags } from '../../scripts/libs.js';

const metaIcons = getMeta(metaTags.icons.metaName);

const sprite = (function setupSprite() {
  let svgSprite = document.getElementById('raqn-svg-sprite');
  if (!svgSprite) {
    svgSprite = document.createElement('div');
    svgSprite.id = 'raqn-svg-sprite';
    document.body.append(svgSprite);
  }
  return svgSprite;
})();

export default class Icon extends ComponentBase {
  static observedAttributes = ['data-active', 'data-icon'];

  #initialIcon = null;

  #activeIcon = null;

  svgSprite = sprite;

  attributesValues = {
    all: {
      attribute: {
        'aria-hidden': 'true',
      },
    },
  };

  get cache() {
    window.ICONS_CACHE ??= {};
    return window.ICONS_CACHE;
  }

  get isActive() {
    return stringToJsVal(this.dataset.active) === true;
  }

  iconUrl(iconName) {
    const path = `${metaIcons}`;
    return `${path}/${iconName}.svg`;
  }

  // Same icon component can be reused with any other icons just by changing the attribute
  async onAttributeIconChanged({ oldValue, newValue }) {
    if (oldValue === newValue) return;

    if (!newValue) return;
    const { initial, active, loadActiveIcon, loadInitialIcon } = this.getIcons(newValue);
    this.#initialIcon = initial;
    this.#activeIcon = active || null;

    const isActiveWithIcon = this.isActive && this.#activeIcon;
    // Wait only for the current icon
    if (isActiveWithIcon) {
      await loadActiveIcon;
    } else {
      await loadInitialIcon;
    }
    this.displayIcon(isActiveWithIcon ? this.#activeIcon : this.#initialIcon);
  }

  // If there is an active icon toggle the icons
  async onAttributeActiveChanged({ oldValue, newValue }) {
    if (!this.initialized) return;
    if (oldValue === newValue) return;
    if (!this.#activeIcon) return;
    this.displayIcon(this.isActive ? this.#activeIcon : this.#initialIcon);
  }

  displayIcon(iconName) {
    this.innerHTML = this.template(iconName);
  }

  getIcons(icon) {
    // ! The initial and active icon names are separated with a double underline
    // ! The active icon is optional;
    const [initial, active] = icon.split('__');

    return {
      initial,
      active,
      loadInitialIcon: this.loadIcon(initial),
      loadActiveIcon: active ? this.loadIcon(active) : null,
    };
  }

  // Load icon can be used externally to load additional icons in the cache
  async loadIcon(iconName) {
    // this.iconName = icon;
    if (!this.cache[iconName]) {
      this.cache[iconName] = {
        loading: this.loadFragment(this.iconUrl(iconName), iconName),
      };
    }
    await this.cache[iconName].loading;
  }

  template(iconName) {
    if (!this.cache[iconName]) return '';
    const { viewBox } = this.cache[iconName];
    const attributes = Object.keys({ viewBox })
      .map((k) => {
        if (this.cache[iconName][k]) {
          return `${k}="${this.cache[iconName][k]}"`;
        }
        return '';
      })
      .join(' ');
    return `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ${attributes}><use xlink:href="#icons-sprite-${iconName}"/></svg>`;
  }

  iconTemplate(iconName, svg, viewBox, width, height) {
    return `<defs><g id="icons-sprite-${iconName}" viewBox="${viewBox}" width="${width}" height="${height}">${svg.innerHTML}</g></defs>`;
  }

  async loadFragment(path, iconName) {
    if (typeof path !== 'string') return;
    const response = await this.getFragment(path);
    await this.processFragment(response, iconName);
  }

  async processFragment(response, iconName) {
    if (response.ok) {
      this.svg = await response.text();

      if (this.svg.match(/(<style | class=|url\(#| xlink:href="#)/)) {
        this.cache[iconName] = {
          styled: true,
          html: this.svg
            // rescope ids and references to avoid clashes across icons;
            .replaceAll(/ id="([^"]+)"/g, (_, id) => ` id="${iconName}-${id}"`)
            .replaceAll(/="url\(#([^)]+)\)"/g, (_, id) => `="url(#${iconName}-${id})"`)
            .replaceAll(/ xlink:href="#([^"]+)"/g, (_, id) => ` xlink:href="#${iconName}-${id}"`),
        };
      } else {
        const dummy = document.createElement('div');
        dummy.innerHTML = this.svg;
        const svg = dummy.querySelector('svg');
        const width = svg.getAttribute('width');
        const height = svg.getAttribute('height');
        const viewBox = svg.getAttribute('viewBox');
        svg.innerHTML = this.iconTemplate(iconName, svg, viewBox, width, height);
        this.cache[iconName].width = width;
        this.cache[iconName].height = height;
        this.cache[iconName].viewBox = viewBox;
        this.cache[iconName].svg = svg;
      }
      this.svgSprite.append(this.cache[iconName].svg);
    } else {
      this.cache[iconName] = false;
    }
  }
}
