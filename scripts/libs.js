import { publish } from './pubsub.js';

export const config = {
  semanticBlocks: ['header', 'footer'],
  blocks: [
    'accordion',
    'breadcrumbs',
    'button',
    'card',
    'external',
    'hero',
    'icon',
    'navigation',
    'router',
    'section-metadata',
    'theme',
    'wrapper',
  ],
  mixinsBlocks: [
    'column',
  ],
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

export function matchMediaQuery(breakpointMin, breakpointMax) {
  const min = `(min-width: ${breakpointMin}px)`;
  const max = breakpointMax ? ` and (max-width: ${breakpointMax}px)` : '';

  return window.matchMedia(`${min}${max}`);
}

export function getBreakPoints() {
  window.raqnBreakpoints ??= {
    ordered: [],
    byName: {},
    activeMinMax: [],
    activeMin: null,
  };

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
        matchMediaMin: matchMediaQuery(breakpointMin),
        matchMediaMinMax: matchMediaQuery(breakpointMin, breakpointMax),
      };
      window.raqnBreakpoints.byName[breakpointMinName] = breakpoint;
      if (breakpoint.matchMediaMin.matches) {
        (window.raqnBreakpoints.activeMin ??= []).push({ ...breakpoint });
      }
      if (breakpoint.matchMediaMinMax.matches) {
        window.raqnBreakpoints.activeMinMax = { ...breakpoint };
      }
      return { ...breakpoint };
    });

  return window.raqnBreakpoints;
}

// This will trigger a `matches = true` event on both increasing and decreasing the viewport size for each viewport type.
// No need for throttle here as the events are only triggered once at a time when the exact condition is valid.
export function publishBreakpointChange() {
  const breakpoints = getBreakPoints();

  if (breakpoints.listenersInitialized) return;
  breakpoints.ordered.forEach((breakpoint) => {
    breakpoint.matchMediaMinMax.addEventListener('change', (e) => {
      
      e.raqnBreakpoint = {
        ...breakpoint,
      };

      if (e.matches) {
        e.previousRaqnBreakpoint = {
          ...breakpoints.activeMinMax,
        };
        breakpoints.activeMinMax = { ...breakpoint };
        breakpoints.activeMin = breakpoints.ordered.filter((br) => br.min <= breakpoint.min);
      }
      /**
       * Based on the breakpoints list there will always be
       * one matching breakpoint and one not matching breakpoint 
       * at fired the same time.
       * 
       * To prevent a subscription callbacks to be fired 2 times in a row,
       * once for matching breakpoint and once for the not matching breakpoint
       * it's advisable to use wither a matching or a non matching event
       */
      // general event fired for matching and non matching breakpoints
      publish('breakpoint::change', e);
      publish(`breakpoint::change::${breakpoint.name}`, e);
      if (e.matches) {
        publish('breakpoint::change::matches', e);
        publish(`breakpoint::change::matches::${breakpoint.name}`);
      } else {
        publish('breakpoint::change::not::matches', e);
        publish(`breakpoint::change::not::matches::${breakpoint.name}`);
      }
    });
  });
  breakpoints.listenersInitialized = true;
};

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
      const activeBreakpoint = getBreakPoints().activeMinMax.name;

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
      if (isKnownAttribute || isClass) attributesValues[key] ??= {};

      // media params always overwrite
      if (classBreakpoint) {
        if (classBreakpoint === activeBreakpoint) {
          mediaAttributes[key] = value;
        }
        if (isKnownAttribute) attributesValues[key][classBreakpoint] = value;
        if (isClass) {
          if (attributesValues[key][classBreakpoint]) {
            attributesValues[key][classBreakpoint] += ` ${value}`;
          } else {
            attributesValues[key][classBreakpoint] = value;
          }
        }
        // support multivalue attributes
      } else if (acc[key]) {
        acc[key] += ` ${value}`;
      } else {
        acc[key] = value;
      }

      if (isKnownAttribute || isClass) attributesValues[key].all = acc[key];

      return acc;
    }, {});

  return { // TODO improve how classes are collected and merged.
    currentAttributes: {
      ...attrs,
      ...mediaAttributes,
      ...((attrs.class || mediaAttributes.class) && { class: `${attrs.class ? attrs.class : ''}${mediaAttributes.class ? ` ${ mediaAttributes.class}` : ''}` }),
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
