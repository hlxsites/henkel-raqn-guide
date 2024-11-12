import ComponentBase from '../../scripts/component-base.js';
import { flat, getBaseUrl } from '../../scripts/libs.js';
import { generalManipulation, renderVirtualDom } from '../../scripts/render/dom.js';

export default class Form extends ComponentBase {
  static observedAttributes = ['schema'];

  dom = [];

  resolver = null;

  loading = new Promise((resolve) => {
    this.resolver = resolve;
  });

  async connected() {
    await this.loading;
    this.append(...renderVirtualDom(generalManipulation(this.dom)));
  }

  get prefix() {
    return `${getBaseUrl()}/schemas/`;
  }

  get sufix() {
    return '.schema.json';
  }

  async applySchema(schema) {
    console.log(schema);
    const n = flat(schema);
    const path = Object.keys(n).reduce((acc, key) => `${acc}${key}-${n[key]}`, '');
    const json = await this.parseSchema(await this.loadSchema(path));
    this.dom = this.schemaToDom(json);
    this.resolver(this.dom);
  }

  schemaToDom(schema) {
    return schema.map((s) => {
      const { key, type, title, required, id, label, placeholder, helpText, pattern } = s;
      return {
        tag: 'raqn-input',
        class: ['form-group'],
        attributes: {
          key,
          type,
          title,
          required,
          id,
          label,
          placeholder,
          helpText,
          pattern,
        },
        children: [
          {
            tag: 'label',
            class: ['form-label'],
            attributes: {
              for: id,
            },
            children: [
              {
                class: ['form-label-text'],
                tag: 'span',
                text: label,
              },
            ],
          },
          {
            tag: 'input',
            class: ['form-control'],
            children: [],
            attributes: {
              type,
              name: key,
              id,
              placeholder,
              pattern,
              required,
              title,
            },
          },
          {
            class: ['form-text'],
            tag: 'small',
            text: helpText,
            children: [],
          },
        ],
      };
    });
  }

  async loadSchema(ref) {
    if (ref.includes('http')) {
      return (await fetch(ref)).json();
    }
    return (await fetch(`${this.prefix}${ref}${this.sufix}`)).json();
  }

  extractName(name) {
    return name.replace(this.prefix, '').replace(this.sufix, '').toLowerCase();
  }

  async parseSchema(data) {
    const { $id, required, properties } = data;
    return Object.keys(properties).reduce(async (acc, key) => {
      const fullfill = await acc;
      const { type, title, description, $ref, pattern } = properties[key];
      if ($ref) {
        const options = await this.parseSchema(await this.loadSchema($ref));

        fullfill.push(...options);
        return fullfill;
      }
      const id = `${this.extractName($id)}-${key}`;
      fullfill.push({
        key,
        type,
        title,
        description,
        required: required.includes(key),
        id: `${id}`,
        i18n: `i18n-${id}`,
        label: `i18n-${id}-label`,
        placeholder: `i18n-${id}-placeholder`,
        helpText: `i18n-${id}-helpText`,
        pattern,
      });
      return fullfill;
    }, []);
  }

  // parse json schema and load any external $ref
}
