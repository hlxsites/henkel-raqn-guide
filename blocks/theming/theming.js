import ComponentBase from '../../scripts/component-base.js';
import {
  flat,
  getBreakPoints,
  getMediaQuery,
  getMetaGroup,
  getMeta,
  metaTags,
  readValue,
  unFlat,
} from '../../scripts/libs.js';

const k = Object.keys;

export default class Theming extends ComponentBase {
  componentsConfig = {};

  elements = {};

  variations = {};

  setDefaults() {
    super.setDefaults();
    this.scapeDiv = document.createElement('div');
    this.themeJson = {};

    this.globalsVar = ['c-', 'global'];
    this.toTags = [];
    this.transform = {};
    this.tags = '';
    this.fontFace = '';
    this.atomic = '';
  }

  fontFaceTemplate(data) {
    const names = Object.keys(data);

    this.fontFace = names
      .map((key) => {
        // files
        const types = Object.keys(data[key].options);
        return types
          .map(
            (type) => `@font-face {
            font-family: '${key}';
            src: url('${window.location.origin}/fonts/${data[key].options[type]}');
            ${type === 'italic' ? 'font-style' : 'font-weight'}: ${type};
            }
            `,
          )
          .join('');
      })
      .join('');
  }

  escapeHtml(unsafe) {
    this.scapeDiv.textContent = unsafe;
    return this.scapeDiv.innerHTML;
  }

  reduceViewports(obj, callback) {
    const breakpoints = Object.keys(obj);
    return breakpoints
      .map((bp) => {
        const options = getBreakPoints();
        if (options.byName[bp]) {
          const { min, max } = options.byName[bp];
          const query = getMediaQuery(min, max);
          return `
@media ${query} {
      ${callback(obj[bp])}
        }
      `;
        }
        // regular
        return callback(obj[bp]);
      })
      .join('\n');
  }

  styles() {
    ['variables', 'tags', 'fontFace'].forEach((cssSegment) => {
      const style = document.querySelector(`style.${cssSegment}`) || document.createElement('style');
      style.innerHTML = this[cssSegment];
      style.classList.add(cssSegment);
      document.head.appendChild(style);
    });
    const themeMeta = getMeta('theme', { getArray: true, divider: ' ' });
    document.body.classList.add(...themeMeta, 'color-default', 'font-default');
  }

  processFragment(responseData, type = 'color') {
    this.themeJson[type] = responseData;
    if (type === 'fontface') {
      this.fontFaceTemplate(responseData);
    } else if (type === 'component') {
      Object.keys(responseData).forEach((key) => {
        if (key.indexOf(':') === 0 || responseData[key].data.length === 0) return;
        this.componentsConfig[key] = this.componentsConfig[key] || {};
        this.componentsConfig[key] = readValue(responseData[key].data, this.componentsConfig[key]);
      });
    } else {
      this.variations = readValue(responseData.data, this.variations);
      this.defineVariations();
    }
  }

  defineVariations() {
    const names = k(this.variations);
    const result = names.reduce((a, name) => {
      const unflatted = unFlat(this.variations[name]);
      return (
        a +
        this.reduceViewports(unflatted, (actionData) => {
          const actions = k(actionData);
          return actions.reduce((b, action) => {
            const actionName = `render${action.charAt(0).toUpperCase()}${action.slice(1)}`;
            if (this[actionName]) {
              return b + this[actionName](actionData[action], name);
            }
            return b;
          }, '');
        })
      );
    }, '');
    this.variables = result;
  }

  renderColor(data, name) {
    return this.variablesValues(data, name, '.color-');
  }

  variablesValues(data, name, prepend = '.') {
    const f = flat(data);
    return `${prepend || '.'}${name} {
      ${k(f)
        .map((key) => `\n--${key}: ${f[key]};`)
        .join('')}
    }
        `;
  }

  variablesScopes(data, name, prepend = '.') {
    const f = flat(data);
    return `${prepend}${name} {
      ${k(f)
        .map((key) => `\n${key}: var(--${name}-${key}, ${f[key]});`)
        .join('')}
    }
        `;
  }

  renderFont(data, name) {
    const elements = k(data);
    const flattened = flat(data);
    this.tags = elements.reduce((a, key) => {
      const props = flat(data[key]);
      return a + this.variablesScopes(props, key, '');
    }, '');
    return this.variablesValues(flattened, name, '.font-');
  }

  async loadFragment() {
    const themeConfigs = getMetaGroup(metaTags.themeConfig.metaNamePrefix);

    // Get the configs async
    const configsResponses = await Promise.allSettled(
      themeConfigs.map(async ({ name, content }) => {
        const response = await fetch(`${content}.json`);
        if (response.ok) {
          return {
            type: name,
            data: await response.json(),
          };
        }
        return { type: null, data: null };
      }),
    );

    // Create the the Styles synchronous
    configsResponses.forEach(({ value = {} }) => {
      if (!value.type) return;
      this.processFragment(value.data, value.type);
    });

    this.styles();
  }
}
