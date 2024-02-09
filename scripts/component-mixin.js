import { getMeta, loadModule } from './libs.js';

export default class ComponentMixin {
  
  static applies(element) {
    return this.observedAttributes && [...element.attributes].map((attribute) => attribute.name)
      .find((search) => this.observedAttributes.find((attribute) => search.startsWith(attribute) || search.startsWith(`data-${attribute}`)));
  }

  static async getMixins() {
    if(!window.raqnMixins) {
      window.raqnMixins = (async () => {
        const mixins = getMeta('mixins');
        window.raqnMixins = await Promise.all((mixins ? mixins.split(',') : []).map(async (mixin) => {
          const { css, js } = loadModule(`/mixins/${mixin.trim()}/${mixin.trim()}`);
          await css;
          const mod = await js;
          return mod.default;
        }));
        return window.raqnMixins;
      })();
    }
    return window.raqnMixins;
  }

  static async startAll(element) {
    return Promise.all(
      (await ComponentMixin.getMixins())
        .filter((mixin) => mixin.applies(element))
        .map((Mixin) => new Mixin(element).start())
    );
  }

  constructor(element) {
    this.element = element;
  }

  getAttribute(name) {
    return this.element.getAttribute(name) || this.element.getAttribute(`data-${name}`);
  }

  async start() {
    // NOP, should be overwritten by implementation
  }
}
