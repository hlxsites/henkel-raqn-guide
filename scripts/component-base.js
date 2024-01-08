export const breakpoints = {
  S: 0,
  M: 768,
  L: 1024,
  XL: 1280,
  XXL: 1920,
};

export function getBreakPoints() {
  window.raqnBreakpoints = window.raqnBreakpoints || {};
  const breakpoint = Object.keys(breakpoints);
  window.raqnBreakpoints = breakpoint.filter(
    (bp) => matchMedia(`(min-width: ${breakpoints[bp]}px)`).matches,
  );
  return window.raqnBreakpoints;
}

export function getBreakPoint() {
  const b = getBreakPoints();
  return b[b.length - 1];
}

export default class ComponentBase {
  constructor(block) {
    this.block = block;
    this.uuid = `gen${crypto.randomUUID().split('-')[0]}`;
    this.setParams();
    Object.keys(this.params).forEach((key) => {
      // @TODO sanitize
      const value = Array.isArray(this.params[key])
        ? this.params[key].join(' ')
        : this.params[key];
      this.block.setAttribute(key, value);
    });
    this.connectedCallback();
  }

  setParams() {
    const mediaParams = {};
    this.params = {
      ...Array.from(this.block.classList)
        .filter((c) => c !== this.blockName && c !== 'block')
        .reduce((acc, c) => {
          const values = c.split('-');
          let key = values.shift();
          const breakpoint = getBreakPoint();
          if (breakpoint === key) {
            key = values.shift();
            mediaParams[key] = values.join('-');
            return acc;
          }

          if (breakpoints[key] !== undefined) {
            return acc;
          }

          if (acc[key] && Array.isArray(acc[key])) {
            acc[key].push(values.join('-'));
          } else if (acc[key]) {
            acc[key] = [acc[key], values.join('-')];
          } else {
            acc[key] = values.join('-');
          }
          return acc;
        }, {}),
      ...mediaParams,
    };
  }

  async connectedCallback() {
    this.block.setAttribute('id', this.uuid);
    if (this.external) {
      await this.load(this.external);
    }
    this.connected();
    this.render();
  }

  async load(block) {
    const response = await fetch(
      `${block}`,
      window.location.pathname.endsWith(block) ? { cache: 'reload' } : {},
    );
    return this.processExternal(response);
  }

  async processExternal(response) {
    if (response.ok) {
      const html = await response.text();
      this.block.innerHTML = html;
    }
    return response;
  }

  connected() {}

  render() {}
}
