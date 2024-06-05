import ComponentBase from '../../scripts/component-base.js';
import { getMeta, unflat } from '../../scripts/libs.js';

const k = Object.keys;

export default class Theming extends ComponentBase {
  nestedComponentsConfig = {};

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

  isGlobal(key) {
    return this.globalsVar.reduce((a, g) => {
      if (key.indexOf(g) > -1) {
        return true;
      }
      return a;
    }, false);
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

  renderVariables(key, row, t) {
    const value = t[key][row];
    let variable = '';
    if (value) {
      variable = `\n--${key}-${row}: ${this.escapeHtml(value).trim()};`;
      this.atomic += `body .${key}-${row} {--${key}: var(--${key}-${row});}\n`;
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

  getVariables(keys, t) {
    return keys.reduce(
      (acc, key) =>
        `${acc}
      ${k(t[key])
        .map((row) => this.renderVariables(key, row, t))
        .join('')}`,
      '',
    );
  }

  readValue(data) {
    let keys = data.map((item) => item.key);
    const themeKeys = k(data[0]).slice(1);
    const globals = keys.filter((item) => this.isGlobal(item));
    keys = keys.filter((item) => !globals.includes(item));
    const t = data.reduce(
      (ac, item, i) =>
        keys.reduce((acc, key) => {
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
    return { keys, themeKeys, t, globals };
  }

  getTheme(themeKeys, keys, t, type = 'color') {
    this.themes = `${this.themes || ''} ${this.getThemeClasses(themeKeys, keys, t, type)}`;
    this.variables = `${this.variables || ''} 
    body { ${this.getVariables(keys, t)} }
    `;

    return { keys, themeKeys, t };
  }

  prepareTags(keys, themeKeys, t) {
    const tags = unflat(t);
    this.tags = Object.keys(tags)
      .map(
        (tag) =>
          `${tag} {
          ${keys
            .filter((key) => key.indexOf(tag) === 0)
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
    ['variables', 'tags', 'atomic', 'themes', 'fontFace'].forEach((cssSegment) => {
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
      this.themeJson[type] = responseData;
      if (type === 'fontface') {
        this.fontFaceTemplate(responseData);
      } else {
        const { keys, themeKeys, t } = this.readValue(responseData.data, type);

        this.getTheme(themeKeys, keys, t, type);
        if (type === 'font') {
          this.prepareTags(keys, themeKeys, t);
        }
      }
    }
  }

  async loadFragment() {
    await fetch('colors.json').then((response) => this.processFragment(response, 'color'));
    await fetch('fonts.json').then((response) => this.processFragment(response, 'font'));
    await fetch('/fonts/index.json').then((response) => this.processFragment(response, 'fontface'));
    this.styles();
  }
}
