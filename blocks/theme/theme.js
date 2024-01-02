import ComponentBase from '../../scripts/component-base.js';

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
      'gap',
    ];
    this.defaultScope = [
      'color',
      'background',
      'margin',
      'icon-size',
      'max-width',
    ];
    this.headingVariables = ['font-size', 'font-weight', 'font-family'];
  }

  fontTagsTemplate(item, keys) {
    return `${item['font-tag']} {${keys
      .map((key) => {
        if (this.headingVariables.includes(key) && item[key]) {
          return `
          ${key}: var(--scope-${key},${item[key]});`;
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
        if (item['font-tag']) {
          return this.fontTagsTemplate(item, keys);
        }
        return '';
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
    this.innerHTML = `<style> body {
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

        ${this.tags}</style>`;
    console.log(this.variables);
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
