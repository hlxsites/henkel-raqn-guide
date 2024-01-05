import ComponentBase from '../../scripts/component-base.js';
import { config } from '../../scripts/libs.js';

export default class Theme extends ComponentBase {
  constructor() {
    super();
    this.external = '/theme.json';

    this.applyToTag = ['font-size', 'font-weight', 'font-family'];
  }

  fontFaceTemplate(fontFace) {
    if (fontFace.indexOf('-') > -1) {
      const [name, ...rest] = fontFace.split('-');
      const params = rest.pop().split('.');
      const format = params.pop();
      const lastBit = params.pop();
      const fontWeight = config.fontWeights[lastBit] || 'regular';
      const fontStyle = lastBit === 'italic' ? lastBit : 'normal';
      return `
@font-face {
  font-family: ${name};
  font-weight: ${fontWeight};
  font-display: swap;
  font-style: ${fontStyle};
  src: url('/fonts/${fontFace}') format(${format});
}
`;
    }
    return '';
  }

  fontTagsTemplate(item, keys) {
    return `${item['font-tag']} {${keys
      .map((key) => {
        if (this.headingVariables.includes(key) && item[key]) {
          return `
          ${key}: var(--scope-${key}, ${
            item[key].indexOf(',') > -1 ? `'${item[key]}'` : item[key]
          });`;
        }
        return '';
      })
      .join('')}}\n`;
  }

  createVariables() {
    const { data } = this.themeJson;
    const k = Object.keys;
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
      .map((index) => {
        const tag = t.tag[index];
        const values = this.applyToTag.reduce((acc, key) => {
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
      })
      .join('\n\n');
    this.fontFace = '';
    this.atomic = '';
    this.variables = k(t)
      .map((key) => {
        const rows = k(t[key]);
        return rows
          .map((row) => {
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
          })
          .join('');
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
      this.createVariables();
      this.styles();
    }
  }
}
