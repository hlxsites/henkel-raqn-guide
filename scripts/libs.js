export const globalConfig = {
  semanticBlocks: ['header', 'footer'],
  blockSelector: '[class]:not(style, [class^="config-" i])',
  breakpoints: {
    xs: 0,
    s: 320,
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

export const metaTags = {
  breadcrumbRoot: {
    metaName: 'breadcrumb-root',
    fallbackContent: '/',
  },
  componentsConfig: {
    metaName: 'components-config',
    fallbackContent: 'components-config',
    // contentType: 'path without extension',
  },
  header: {
    metaName: 'header',
    fallbackContent: 'header',
    // contentType: 'path without extension',
  },
  footer: {
    metaName: 'footer',
    fallbackContent: 'footer',
    // contentType: 'path without extension',
  },
  structure: {
    metaNamePrefix: 'structure',
    // contentType: 'boolean string',
  },
  lcp: {
    metaName: 'lcp',
    fallbackContent: ['theming', 'header', 'breadcrumbs'],
    // contentType: 'string of comma separated component names',
  },
  eagerImage: {
    metaName: 'eager-images',
    // contentType: 'number string',
  },
  themecolor: {
    metaName: 'color',
    fallbackContent: 'color',
    // contentType: 'path without extension',
  },
  themefont: {
    metaName: 'color',
    fallbackContent: 'font',
    // contentType: 'path without extension',
  },
  themelayout: {
    metaName: 'layout',
    fallbackContent: 'layout',
    // contentType: 'path without extension',
  },
  themecomponent: {
    metaName: 'component',
    fallbackContent: 'components-config',
    // contentType: 'path without extension',
  },
  theme: {
    metaName: 'theme',
    fallbackContent: 'color-default font-default',
    // contentType: 'string theme name',
  },
};

export const camelCaseAttr = (val) => val.replace(/-([a-z])/g, (k) => k[1].toUpperCase());
export const capitalizeCaseAttr = (val) => camelCaseAttr(val.replace(/^[a-z]/g, (k) => k.toUpperCase()));

export function getMediaQuery(breakpointMin, breakpointMax) {
  const min = `(min-width: ${breakpointMin}px)`;
  const max = breakpointMax ? ` and (max-width: ${breakpointMax}px)` : '';
  return `${min}${max}`;
}

export function matchMediaQuery(breakpointMin, breakpointMax) {
  return window.matchMedia(getMediaQuery(breakpointMin, breakpointMax));
}

export function getBreakPoints() {
  window.raqnBreakpoints ??= {
    ordered: [],
    byName: {},
    active: null,
  };

  // return if already set
  if (window.raqnBreakpoints.ordered.length) return window.raqnBreakpoints;

  window.raqnBreakpoints.ordered = Object.entries(globalConfig.breakpoints)
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
  const listeners = [];
  breakpoints.ordered.forEach((breakpoint) => {
    const fn = (e) => {
      e.raqnBreakpoint = { ...breakpoint };

      if (e.matches) {
        e.previousRaqnBreakpoint = { ...active };
        active = { ...breakpoint };
        if (breakpoints.active.name !== breakpoint.name) {
          breakpoints.active = { ...breakpoint };
        }
      }

      callback?.(e);
    };
    listeners.push({ media: breakpoint.matchMedia, callback: fn });
    breakpoint.matchMedia.addEventListener('change', fn);
  });

  return {
    removeBreakpointListeners: () => {
      listeners.forEach((listener) => listener.media.removeEventListener('change', listener.callback));
    },
  };
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

export function stringToJsVal(string, options) {
  const { trim = false } = options || {};
  switch (string?.trim().toLowerCase()) {
    case 'true':
      return true;
    case 'false':
      return false;
    case 'null':
      return null;
    case 'undefined':
      return undefined;
    default:
      return trim ? string.trim() : string;
  }
}

export function stringToArray(val, options) {
  const { divider = ',' } = options || {};
  if (typeof val !== 'string') return [];
  const cleanVal = val.trim().replace(new RegExp(`^${divider}+|${divider}+$`, 'g'), '');
  if (!cleanVal?.length) return [];
  return cleanVal.split(divider).flatMap((x) => {
    const value = x.trim();
    if (value === '') return [];
    return [value];
  });
}

// retrive data from excel json format
export function readValue(data, extend = {}) {
  const k = Object.keys;
  const keys = k(data[0]).filter((item) => item !== 'key');
  return data.reduce((acc, row) => {
    const mainKey = row.key;
    keys.reduce((a, key) => {
      if (!row[key]) return a;
      if (!a[key]) {
        a[key] = { [mainKey]: row[key] };
      } else {
        a[key][mainKey] = row[key];
      }
      return a;
    }, acc);
    return acc;
  }, extend);
}

export function getMeta(name, settings) {
  const { getArray = false } = settings || {};
  const meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    return null;
  }
  const val = stringToJsVal(meta.content);
  if (getArray) {
    return stringToArray(val);
  }
  return val;
}

export function getMetaGroup(group) {
  const prefix = `${group}-`;
  const metaGroup = [...document.querySelectorAll(`meta[name^="${prefix}"]`)];
  return metaGroup.map((meta) => ({
    name: meta.name.replace(new RegExp(`^${prefix}`), ''),
    content: stringToJsVal(meta.content),
  }));
}

export function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function isOnlyObject(item) {
  return isObject(item) && item !== window && !(item instanceof HTMLElement);
}

export function deepMerge(origin, ...toMerge) {
  if (!toMerge.length) return origin;
  const merge = toMerge.shift();

  if (isOnlyObject(origin) && isOnlyObject(merge)) {
    Object.keys(merge).forEach((key) => {
      if (isOnlyObject(merge[key])) {
        if (!origin[key]) Object.assign(origin, { [key]: {} });
        deepMerge(origin[key], merge[key]);
      } else {
        Object.assign(origin, { [key]: merge[key] });
      }
    });
  }

  return deepMerge(origin, ...toMerge);
}

export function loadModule(urlWithoutExtension, loadCSS = true) {
  try {
    const js = import(`${urlWithoutExtension}.js`);
    if (!loadCSS) return { js, css: Promise.resolve() };
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
      console.log('could not load module style', urlWithoutExtension, error),
    );

    return { css, js };
  } catch (error) {
    console.log('could not load module', urlWithoutExtension, error);
  }
  return { css: Promise.resolve(), js: Promise.resolve() };
}

export function mergeUniqueArrays(...arrays) {
  const mergedArrays = arrays.reduce((acc, arr) => [...acc, ...(arr || [])], []);
  return [...new Set(mergedArrays)];
}

export function getBaseUrl() {
  return document.head.querySelector('base').href;
}

export function isHomePage(url) {
  return getBaseUrl() === (url || window.location.href);
}

export const popupState = {
  set activePopup(openPopup) {
    window.raqnOpenPopup = openPopup;
  },

  get activePopup() {
    return window.raqnOpenPopup;
  },

  isThisActive(popup) {
    return this.activePopup === popup;
  },

  closeActivePopup() {
    if (!this.activePopup) return;
    window.raqnOpenPopup.dataset.active = false;
    window.raqnOpenPopup = null;
  },
};

export const keyMap = {
  TAB: 9,
  ENTER: 13,
  SPACE: 32,
  ESCAPE: 27,
  ARROW_DOWN: 40,
  ARROW_UP: 38,
  ARROW_RIGHT: 39,
  ARROW_LEFT: 37,
};

export const focusableEls = [
  'a[href]:not([disabled])',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input[type="text"]:not([disabled])',
  'input[type="radio"]:not([disabled])',
  'input[type="checkbox"]:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([disabled])',
];

export const focusFirstElementInContainer = (container, { timeoutTime } = { timeoutTime: 500 }) => {
  // keep timeout to prevent CSS transition interruption
  setTimeout(() => {
    const focusableElements = container.querySelectorAll(focusableEls.join(', '));
    const focusableElement = [...focusableElements].find((el) => el.offsetWidth > 0 && el.offsetHeight > 0);

    if (focusableElement) {
      focusableElement.focus();
    }
  }, timeoutTime);
};

export const focusTrap = (elem, { dynamicContent } = { dynamicContent: false }) => {
  let focusEls = elem.querySelectorAll(focusableEls.join(', '));
  let firstFocusableEl = focusEls[0];
  let lastFocusableEl = focusEls[focusEls.length - 1];

  elem.addEventListener('keydown', (e) => {
    if (dynamicContent) {
      focusEls = elem.querySelectorAll(focusableEls.join(', '));
      [firstFocusableEl] = focusEls;
      lastFocusableEl = focusEls[focusEls.length - 1];
    }

    if (e.key === 'Tab' || e.keyCode === keyMap.TAB) {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableEl) {
          lastFocusableEl.focus();
          e.preventDefault();
        }
      } else if (document.activeElement === lastFocusableEl) {
        firstFocusableEl.focus();
        e.preventDefault();
      }
    }
  });
};

/**
 * flattenProperties: convert objects from {a:{b:{c:{d:1}}}} to all subkeys as strings {'a-b-c-d':1}
 *
 * @param {Object} obj - Object to flatten
 * @param {String} alreadyFlat - prefix or recursive keys.
 * */

export function flat(obj = {}, alreadyFlat = '', sep = '-', maxDepth = 10) {
  const f = {};
  // check if its a object
  Object.keys(obj).forEach((k) => {
    // get the value
    const value = obj[k].valueOf() || obj[k];
    // append key to already flatten Keys
    const key = `${alreadyFlat ? `${alreadyFlat}${sep}` : ''}${k}`;
    // if still a object fo recursive
    if (isObject(value) && maxDepth > 0) {
      Object.assign(f, flat(value, key, sep, maxDepth - 1));
    } else {
      // there is a real value so add key to flat object
      f[key] = value;
    }
  });
  return f;
}

export function flatAsValue(data, sep = '-') {
  return Object.entries(data)
    .reduce((acc, [key, value]) => {
      if (isObject(value)) {
        return flatAsValue(value, acc);
      }
      return `${acc} ${key}${sep}${value}`;
    }, '')
    .trim();
}

/**
 * unFlattenProperties: convert objects from subkeys as strings {'a-b-c-d':1} to tree {a:{b:{c:{d:1}}}}
 *
 * @param {Object} obj - Object to unflatten
 * */

export function unflat(f, sep = '-') {
  const un = {};
  // for each key create objects
  Object.keys(f).forEach((key) => {
    const properties = key.split(sep);
    const value = f[key];
    properties.reduce((unflating, prop, i) => {
      if (!unflating[prop]) {
        const step = i < properties.length - 1 ? { [prop]: {} } : { [prop]: value };
        Object.assign(unflating, step);
      }
      return unflating[prop];
    }, un);
  });
  return un;
}

export const classToFlat = (classes = [], valueLength = 1, extend = {}) =>
  unflat(
    classes.reduce((acc, c) => {
      const length = c.split('-').length - valueLength;
      const key = c.split('-').slice(0, length).join('-');
      const value = c.split('-').slice(length).join('-');
      if (!acc[key]) acc[key] = {};
      acc[key] = value;
      return acc;
    }, extend),
  );
