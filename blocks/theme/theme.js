import ComponentBase from '../../scripts/component-base.js';
import { config } from '../../scripts/libs.js';
// minify alias
const k = Object.keys;

export default class Theme extends ComponentBase {
  constructor() {
    super();
    this.external = '/theme.json';
    this.toTags = ['font-size', 'font-weight', 'font-family'];
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
      return `\n@font-face {\nfont-family: ${name};\nfont-weight: ${fontWeight};\nfont-display: swap;\nfont-style: ${fontStyle};\nsrc: url('/fonts/${fontFace}') format(${format});\n}\n`;
    }
    return '';
  }

  fontTags(t, index) {
    const tag = t.tag[index];
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
      return `${tag} {\n${k(val)
        .map((v) => `${v}: ${val[v]};`)
        .join('\n')}\n}`;
    });
  }

  renderVariables(key, row, t) {
    const value = t[key][row];
    let variable = '';
    if (value) {
      if (key === 'font-face') {
        this.fontFace += this.fontFaceTemplate(value);
      } else {
        variable = `\n--raqn-${key}-${row}: ${value};\n`;
        if (row === 'default') {
          variable += `\n--scope-${key}: ${value};\n`;
        }

        this.atomic += `\n.${key}-${row} {\n--scope-${key}: var(--raqn-${key}-${row}, ${value}); \n}\n`;
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
          const ind = keys.indexOf(key);
          if (i === ind) {
            acc[key] = item;
          }
          return acc;
        }, ac),
      {},
    );

    this.tags = k(t.tag)
      .map((index) => this.fontTags(t, index))
      .join('\n\n');

    this.variables = k(t)
      .map((key) => {
        const rows = k(t[key]);
        return rows.map((row) => this.renderVariables(key, row, t)).join('');
      })
      .join('');
  }

  styles() {
    const style = document.createElement('style');
    style.innerHTML = `${this.fontFace}\n\nbody {\n${this.variables}\n}\n\n${this.tags}\n\n${this.atomic}`;
    document.head.appendChild(style);
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
