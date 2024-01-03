import ComponentBase from '../../scripts/component-base.js';
import { config } from '../../scripts/libs.js';

export default class Theme extends ComponentBase {
  constructor() {
    super();
    this.external = '/theme.json';
    this.allowedVariables = [
      'color',
      'background',
      'margin',
      'font-size',
      'font-weight',
      'font-family',
      'icon-size',
      'max-width',
      'header-height',
      'header-background',
      'header-color',
      'gap',
    ];
    this.defaultScope = [
      'color',
      'background',
      'margin',
      'icon-size',
      'font-family',
      'max-width',
    ];
    this.headingVariables = ['font-size', 'font-weight', 'font-family'];
  }

  fontFaceTemplate(item) {
    const { 'font-face': fontFace } = item;

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
    const keys = Object.keys(data[0]).filter((key) =>
      this.allowedVariables.includes(key),
    );
    this.tags = data
      .map((item) => {
        let tags = '';
        if (item['font-face']) {
          tags += this.fontFaceTemplate(item);
        }
        if (item['font-tag']) {
          tags += this.fontTagsTemplate(item, keys);
        }
        return tags;
      })
      .join('')
      .trim();
    this.variables = {};
    data.reduce((acc, item, index) => {
      keys.forEach((key) => {
        if (item[key]) {
          acc[`${key}-${index + 1}`] = {
            value: item[key],
            scope: key,
          };
        }
      });
      return acc;
    }, this.variables);
  }

  styles() {
    const style = document.createElement('style');
    style.innerHTML = `body {
            ${Object.keys(this.variables)
              .map((key) => {
                const { scope, value } = this.variables[key];
                return `${
                  key.indexOf(1) > -1 && this.defaultScope.includes(scope)
                    ? `--scope-${scope}: ${value};`
                    : ''
                }
                --raqn-${key}: ${value};`;
              })
              .join('\n')}
        }
        ${Object.keys(this.variables)
          .map(
            (key) => `.${key} {
                --scope-${this.variables[key].scope}: ${this.variables[key].value};\n}`,
          )
          .join('\n')}

        ${this.tags}`;
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
