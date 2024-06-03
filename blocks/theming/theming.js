import ComponentBase from '../../scripts/component-base.js';
import { globalConfig, getMeta, unflat } from '../../scripts/libs.js';
// minify alias
// const metaTheming = getMeta('theming');
// const metaFragment = metaTheming && `${metaTheming}.json`;
const k = Object.keys;

export default class Theming extends ComponentBase {
  nestedComponentsConfig = {};

  setDefaults() {
    super.setDefaults();
    this.scapeDiv = document.createElement('div');
    this.themeJson = { data: [] };

    this.globalsVar = ['c-', 'global'];
    this.toTags = [];
    this.transform = {};
    this.tags = '';
    this.fontFace = '';
    this.atomic = '';
  }

  isGlobal(key) {
    return this.globalsVar.reduce((a, g) => {
      if (key.indexOf(g) > -1) {
        return true;
      }
      return a;
    }, false);
  }

  fontFaceTemplate(fontFace) {
    if (fontFace.indexOf('-') > -1) {
      const [name, ...rest] = fontFace.split('-');
      const params = rest.pop().split('.');
      const format = params.pop();
      const lastBit = params.pop();
      const fontWeight = globalConfig.fontWeights[lastBit] || 'regular';
      const fontStyle = lastBit === 'italic' ? lastBit : 'normal';
      // eslint-disable-next-line max-len
      return `@font-face {font-family: ${name};font-weight: ${fontWeight};font-display: swap;font-style: ${fontStyle};src: url('/fonts/${fontFace}') format(${format});}`;
    }
    return '';
  }

  fontTags(t, index) {
    const tag = t.tags[index];
    const values = this.toTags.reduce((acc, key) => {
      if (t[key][index]) {
        if (acc[tag]) {
          acc[tag][key] = t[key][index];
        } else {
          acc[tag] = { [key]: t[key][index] };
        }
      }
      return acc;
    }, {});
    return k(values).map((value) => {
      const val = values[value];
      return `${tag} {${k(val)
        .map((v) => `${this.getKey(v)}: var(--${this.getKey(v)}, ${val[v]});`)
        .join('')}}`;
    });
  }

  getKey(key) {
    return this.transform[key] ? this.transform[key] : key;
  }

  escapeHtml(unsafe) {
    this.scapeDiv.textContent = unsafe;
    return this.scapeDiv.innerHTML;
  }

  renderVariables(key, row, t) {
    const value = t[key][row];
    let variable = '';
    if (value) {
      variable = `\n--${this.getKey(key)}-${row}: ${this.escapeHtml(value).trim()};`;
      this.atomic += `body .${this.getKey(key)}-${row} {--${this.getKey(key)}: var(--${this.getKey(key)}-${row});}\n`;
    }
    return variable;
  }

  getThemeClasses(themeKeys, keys, t, segment = 'theme') {
    return themeKeys.reduce(
      (acc, theme) => `${acc}
      .${segment}-${theme} {
        ${keys.reduce((a, key) => {
          if (t[key][theme]) {
            return `${a} \n --${key}: var(--${key}-${theme});`;
          }
          return a;
        }, '')}
      }
      `,
      '',
    );
  }

  getVariables(themeKeys, keys, t) {
    return keys.reduce(
      (acc, key) =>
        `${acc}
      ${k(t[key])
        .map((row) => this.renderVariables(key, row, t))
        .join('')}`,
      '',
    );
  }

  readValue(data, type) {
    let keys = data.map((item) => item.key);
    const themeKeys = k(data[0]).slice(1);
    const globals = keys.filter((item) => this.isGlobal(item));
    keys = keys.filter((item) => !globals.includes(item));
    const t = data.reduce(
      (ac, item, i) =>
        keys.reduce((acc, key) => {
          delete item.key;
          if (!this.themesKeys) {
            this.themesKeys = k(item);
          }
          const ind = keys.indexOf(key);
          if (i === ind) {
            acc[key] = item;
          }
          return acc;
        }, ac),
      {},
    );

    this.themes = `${this.themes || ''} ${this.getThemeClasses(themeKeys, keys, t, type)}`;
    this.variables = `${this.variables || ''} 
    body { ${this.getVariables(themeKeys, keys, t)} }
    `;

    return { keys, themeKeys, t };

    // console.log('theme classes', this.variables);

    // // font tags
    // if (t.tags) {
    //   this.tags =
    //     (this.tags || '') +
    //     k(t.tags)
    //       .map((index) => this.fontTags(t, index))
    //       .join('\n');
    // }
    // // full scoped theme classes
    // this.themes =
    //   (this.themes || '') +
    //   this.themesKeys
    //     .map(
    //       (theme) => `.theme-${theme} {${k(t)
    //         .filter((key) => ![...this.skip, ...this.toTags].includes(key))
    //         .map((key) => (t[key][theme] ? `--${key}: var(--${key}-${theme});` : ''))
    //         .filter((v) => v !== '')
    //         .join('')}
    //   }`,
    //     )
    //     .join('');

    // this.variables = `${this.variables || ''} body{${k(t)
    //   .filter((key) => ![...this.skip].includes(key))
    //   .map((key) => {
    //     const rows = k(t[key]);
    //     return rows.map((row) => this.renderVariables(key, row, t)).join('');
    //   })
    //   .join('')}}`;
  }

  prepareTags(keys, themeKeys, t) {
    // console.log('prepareTags keys', unFlattenPropertieskeys, themeKeys, t);
    const tags = unflat(t);

    this.tags = Object.keys(tags)
      .map(
        (tag) =>
          `${tag} {
          ${keys
            .filter((key) => key.indexOf(tag) > -1)
            .reduce((acc, prop) => {
              const val = t[prop].default;

              return `${acc}
          ${prop.replace(`${tag}-`, '')}: var(--${prop},${val});
          `;
            }, '')}}
          `,
      )
      .join('');
  }

  styles() {
    ['variables', 'tags', 'atomic', 'themes'].forEach((cssSegment) => {
      const style = document.createElement('style');
      style.innerHTML = this[cssSegment];
      style.classList.add(cssSegment);
      document.head.appendChild(style);
    });
    const themeMeta = getMeta('theme');
    document.body.classList.add(themeMeta, 'font-default', 'color-default');
  }

  async processFragment(response, type = 'color') {
    if (response.ok) {
      const responseData = await response.json();
      const { keys, themeKeys, t } = this.readValue(responseData.data, type);
      if (type === 'font') {
        this.prepareTags(keys, themeKeys, t);
      }
    }
  }

  colors(data) {
    console.log('colors', data);
  }

  async loadFragment() {
    //  load colors
    await fetch('colors.json').then((response) => this.processFragment(response));
    //  load fonts
    await fetch('fonts.json').then((response) => this.processFragment(response, 'font'));

    this.styles();
  }
}
