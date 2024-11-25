import ComponentBase from '../../scripts/component-base.js';
import {
  capitalizeCase,
  flat,
  getMediaQuery,
  getMetaGroup,
  getMeta,
  metaTags,
  readValue,
  unFlat,
  getBaseUrl,
  runTasks,
} from '../../scripts/libs.js';

const k = Object.keys;

export default class Theming extends ComponentBase {
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
          .map((type) => {
            document.head.insertAdjacentHTML(
              'beforeend',
              `<link rel="preload" href="${window.location.origin}/fonts/${data[key].options[type]}" as="font" type="font/woff2" crossorigin>`,
            );
            return `@font-face {
  font-display: fallback;
  font-family: '${key}';
  src: url('${window.location.origin}/fonts/${data[key].options[type]}');
  ${type === 'italic' ? 'font-style' : 'font-weight'}: ${type};
}`;
          })
          .join('\n');
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
        const options = this.breakpoints;
        if (options.byName[bp]) {
          const { min, max } = options.byName[bp];
          const query = getMediaQuery(min, max);
          return `
@media ${query} {
    ${callback(obj[bp], options.byName[bp])}
}`;
        }
        // regular
        return callback(obj[bp], 'all');
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

  async processFragment(response, type = 'color') {
    if (response.ok) {
      const isComponent = type === 'component';

      const responseData = await (isComponent ? response : response.json());
      this.themeJson[type] = responseData;
      if (type === 'fontface') {
        this.fontFaceTemplate(responseData);
      } else if (isComponent) {
        Object.keys(responseData).forEach((key) => {
          if (key.indexOf(':') === 0 || responseData[key].data.length === 0) return;
          this.componentsConfig[key] ??= {};
          this.componentsConfig[key] = readValue(responseData[key].data, this.componentsConfig[key]);
        });
      } else {
        this.variations = readValue(responseData.data, this.variations);
      }
      return this.themeJson[type];
    }
    return false;
  }

  defineVariations() {
    const names = k(this.variations);
    const result = names.reduce((acc, name) => {
      const unflatted = unFlat(this.variations[name]);
      return (
        acc +
        this.reduceViewports(unflatted, (actionData, breakpoint) => {
          const actions = k(actionData);
          return actions.reduce((b, action) => {
            const actionName = `render${capitalizeCase(action)}`;
            if (this[actionName]) {
              return b + this[actionName](actionData[action], name, breakpoint);
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
  .map((key) => `--${key}: ${f[key]};`)
  .join('\n')}
}\n`;
  }

  variablesScopes(data, name, prepend = '.') {
    const f = flat(data);
    return `${prepend}${name} {
${k(f)
  .map((key) => `${key}: var(--${name}-${key}, ${f[key]});`)
  .join('\n')}
  }`;
  }

  renderFont(data, name, breakpoint) {
    const elements = k(data);
    const flattened = flat(data, '', '-');

    if (!this.tags.length && breakpoint === 'all' && name === 'default') {
      this.tags = elements.reduce((acc, key) => {
        const props = data[key];

        return `${acc}\n ${this.variablesScopes(props, key, '')}`;
      }, '');
    }
    return this.variablesValues(flattened, name, '.font-');
  }

  async loadFragment() {
    const { themeConfig } = metaTags;
    const themeConfigs = getMetaGroup(themeConfig.metaNamePrefix);
    const base = getBaseUrl();
    await runTasks.call(
      this,
      null,
      function loadConfigs() {
        return Promise.allSettled(
          themeConfigs.map(async ({ name, content, nameWithPrefix }) => {
            if (!content.includes(`${themeConfig.fallbackContent}`) && name !== 'fontface') {
              // eslint-disable-next-line no-console
              console.error(
                `The configured "${nameWithPrefix}" config url is not containing a "${themeConfig.fallbackContent}" folder.`,
              );
              return {};
            }

            const response = await fetch(`${name !== 'fontface' ? base : ''}${content}.json`);
            return this.processFragment(response, name);
          }),
        );
      },
      this.defineVariations,
      this.styles,
    );

    setTimeout(() => {
      document.body.style.display = 'block';
    });
  }
}
