import ComponentBase from '../../scripts/component-base.js';
import { config } from '../../scripts/libs.js';
// minify alias
const k = Object.keys;

export default class Theme extends ComponentBase {
  constructor() {
    super();
    this.scapeDiv = document.createElement('div');
    this.external = '/theme.json';
    this.skip = ['tags', 'font-face'];
    this.toTags = ['font-size', 'font-weight', 'font-family', 'line-height', 'font-style'];
    this.tags = '';
    this.fontFace = '';
    this.atomic = '';
  }

  fontFaceTemplate(fontFace) {
    if (fontFace.indexOf('-') > -1) {
      const [name, ...rest] = fontFace.split('-');
      const params = rest.pop().split('.');
      const format = params.pop();
      const lastBit = params.pop();
      const fontWeight = config.fontWeights[lastBit] || 'regular';
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
        .map((v) => `${v}: ${val[v]};`)
        .join('')}}`;
    });
  }

  escapeHtml(unsafe) {
    this.scapeDiv.textContent = unsafe;
    return this.scapeDiv.innerHTML;
  }

  renderVariables(key, row, t) {
    const value = t[key][row];
    let variable = '';
    if (value) {
      if (key === 'font-face') {
        this.fontFace += this.fontFaceTemplate(value);
      } else {
        variable = `\n--raqn-${key}-${row}: ${this.escapeHtml(value).trim()};\n`;
        this.atomic += `\nbody .${key}-${row} {\n--scope-${key}: var(--raqn-${key}-${row});}\n`;
      }
    }
    return variable;
  }

  readValue() {
    const { data } = this.themeJson;
    const keys = data.map((item) => item.key);
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
    // font tags
    if (t.tags) {
      this.tags = k(t.tags)
        .map((index) => this.fontTags(t, index))
        .join('\n');
    }
    // full scoped theme classes
    this.themes = this.themesKeys
      .map(
        (theme) => `.theme-${theme} {${k(t)
          .filter((key) => ![...this.skip, ...this.toTags].includes(key))
          .map((key) =>
            t[key][theme]
              ? `\n--scope-${key}: var(--raqn-${key}-${theme});`
              : '',
          )
          .filter((v) => v !== '')
          .join('')}
        }`,
      )
      .join('');

    this.variables = k(t)
      .filter((key) => ![...this.skip, ...this.toTags].includes(key))
      .map((key) => {
        const rows = k(t[key]);
        return rows.map((row) => this.renderVariables(key, row, t)).join('');
      })
      .join('');
  }

  styles() {
    const style = document.createElement('style');
    style.innerHTML = `${this.fontFace}body {${this.variables}}${this.tags}${this.atomic}${this.themes}`;
    document.head.appendChild(style);
    document.body.classList.add('theme-default');
    document.body.style.display = 'block';
  }

  async processExternal(response) {
    if (response.ok) {
      this.themeJson = await response.json();
      this.readValue();
      this.styles();
    }
  }
}
