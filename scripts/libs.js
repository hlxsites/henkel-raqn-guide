export const config = {
  semanticBlocks: ['header', 'footer'],
  breakpoints: {
    xs: 0,
    s: 480,
    m: 768,
    l: 1024,
    xl: 1280,
    xxl: 1920,
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
};

export const camelCaseAttr = (val) => val.replace(/-([a-z])/g, (k) => k[1].toUpperCase());
export const capitalizeCaseAttr = (val) => camelCaseAttr(val.replace(/^[a-z]/g, (k) => k.toUpperCase()));

export function matchMediaQuery(breakpointMin, breakpointMax) {
  const min = `(min-width: ${breakpointMin}px)`;
  const max = breakpointMax ? ` and (max-width: ${breakpointMax}px)` : '';

  return window.matchMedia(`${min}${max}`);
}

export function getBreakPoints() {
  window.raqnBreakpoints ??= {
    ordered: [],
    byName: {},
    active: null,
  };

  // return if already set
  if (window.raqnBreakpoints.ordered.length) return window.raqnBreakpoints;

  window.raqnBreakpoints.ordered = Object.entries(config.breakpoints)
    .sort((a, b) => a[1] - b[1])
    .map(([breakpointMinName, breakpointMin], index, arr) => {
      const [, breakpointNext] = arr[index + 1] || [];
      const breakpointMax = breakpointNext ? breakpointNext - 1 : null;
      const breakpoint = {
        name: breakpointMinName,
        min: breakpointMin,
        max: breakpointMax,
        matchMedia: matchMediaQuery(breakpointMin, breakpointMax),
      };
      window.raqnBreakpoints.byName[breakpointMinName] = breakpoint;

      if (breakpoint.matchMedia.matches) {
        window.raqnBreakpoints.active = { ...breakpoint };
      }
      return { ...breakpoint };
    });

  return window.raqnBreakpoints;
}

export function listenBreakpointChange(callback) {
  const breakpoints = getBreakPoints();
  let { active } = breakpoints;

  breakpoints.ordered.forEach((breakpoint) => {
    breakpoint.matchMedia.addEventListener('change', (e) => {
      e.raqnBreakpoint = { ...breakpoint };

      if (e.matches) {
        e.previousRaqnBreakpoint = { ...active };
        active = { ...breakpoint };
        if (breakpoints.active.name !== breakpoint.name) {
          breakpoints.active = { ...breakpoint };
        }
      }

      callback?.(e);
    });
  });
}

export const debounce = (func, wait, immediate) => {
  let timeout;
  return (...args) => {
    const later = () => {
      timeout = null;
      if (!immediate) {
        func(...args);
      }
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      func(...args);
    }
  };
};

export const eagerImage = (block, length = 1) => {
  const imgs = Array.from(block.querySelectorAll('img')).slice(0, length);
  imgs.forEach((img) => {
    const width = img.getAttribute('width');
    const height = img.getAttribute('height');
    const ratio = Math.floor((width / height) * 100) / 100;
    img.style.aspectRatio = ratio;
    img.setAttribute('loading', 'eager');
  });
};

export function getMeta(name) {
  const meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    return null;
  }
  return meta.content;
}

export function collectAttributes(blockName, classes, mixins, knownAttributes = [], element = null) {
  const mediaAttributes = {};
  // inherit default param values
  const attributesValues = element?.attributesValues || {};

  const mixinKnownAttributes = mixins.flatMap((mixin) => mixin.observedAttributes || []);
  const attrs = Array.from(classes)
    .filter((c) => c !== blockName && c !== 'block')
    .reduce((acc, c) => {
      let value = c;
      let isKnownAttribute = null;
      let isMixinKnownAttributes = null;

      const classBreakpoint = Object.keys(config.breakpoints).find((b) => c.startsWith(`${b}-`));
      const activeBreakpoint = getBreakPoints().active.name;

      if (classBreakpoint) {
        value = value.slice(classBreakpoint.length + 1);
      }

      let key = 'class';
      const isClassValue = value.startsWith(key);
      if (isClassValue) {
        value = value.slice(key.length + 1);
      } else {
        isKnownAttribute = knownAttributes.find((attribute) => value.startsWith(`${attribute}-`));
        isMixinKnownAttributes = mixinKnownAttributes.find((attribute) => value.startsWith(`${attribute}-`));
        const getKnownAttribute = isKnownAttribute || isMixinKnownAttributes;
        if (getKnownAttribute) {
          key = getKnownAttribute;
          value = value.slice(getKnownAttribute.length + 1);
        }
      }

      const isClass = key === 'class';
      const camelCaseKey = camelCaseAttr(key);
      if (isKnownAttribute || isClass) attributesValues[camelCaseKey] ??= {};

      // media params always overwrite
      if (classBreakpoint) {
        if (classBreakpoint === activeBreakpoint) {
          mediaAttributes[key] = value;
        }
        if (isKnownAttribute) attributesValues[camelCaseKey][classBreakpoint] = value;
        if (isClass) {
          if (attributesValues[camelCaseKey][classBreakpoint]) {
            attributesValues[camelCaseKey][classBreakpoint] += ` ${value}`;
          } else {
            attributesValues[camelCaseKey][classBreakpoint] = value;
          }
        }
        // support multivalue attributes
      } else if (acc[key]) {
        acc[key] += ` ${value}`;
      } else {
        acc[key] = value;
      }

      if (isKnownAttribute || isClass) attributesValues[camelCaseKey].all = acc[key];

      return acc;
    }, {});

  return {
    // TODO improve how classes are collected and merged.
    currentAttributes: {
      ...attrs,
      ...mediaAttributes,
      ...((attrs.class || mediaAttributes.class) && {
        class: `${attrs.class ? attrs.class : ''}${mediaAttributes.class ? ` ${mediaAttributes.class}` : ''}`,
      }),
    },
    attributesValues,
  };
}

export function loadModule(urlWithoutExtension) {
  const js = import(`${urlWithoutExtension}.js`);
  const css = new Promise((resolve, reject) => {
    const cssHref = `${urlWithoutExtension}.css`;
    if (!document.querySelector(`head > link[href="${cssHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      link.onload = resolve;
      link.onerror = reject;
      document.head.append(link);
    } else {
      resolve();
    }
  }).catch((error) =>
    // eslint-disable-next-line no-console
    console.trace('could not load module style', urlWithoutExtension, error),
  );

  return { css, js };
}
