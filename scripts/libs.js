export const globalConfig = {
  semanticBlocks: ['header', 'footer'],
  blockSelector: `
  [class]:not(
    .section-metadata,
    [raqnwebcomponent],
    style,
    [class^="config-" i]
  )`,
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
  classes: {
    noScroll: 'no-scroll',
  },
};

export const metaTags = {
  breadcrumbRoot: {
    metaName: 'breadcrumb-root',
    fallbackContent: '/',
  },
  icons: {
    metaName: 'icons',
    fallbackContent: '/assets/icons',
    // contentType: 'path without extension',
  },
  header: {
    metaName: 'header',
    fallbackContent: '/header',
    // contentType: 'path without extension',
  },
  footer: {
    metaName: 'footer',
    fallbackContent: '/footer',
    // contentType: 'path without extension',
  },
  structure: {
    metaNamePrefix: 'structure',
    // contentType: 'boolean string',
  },
  template: {
    metaName: 'template',
    fallbackContent: 'template',
    // contentType: 'string template name',
  },
  templateConfig: {
    metaName: 'template-config',
    // contentType: 'string template config name',
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
  themeConfig: {
    metaNamePrefix: 'theme-config',
    // contentType: 'boolean string',
  },
  themeConfigColor: {
    metaName: 'theme-config-color',
    fallbackContent: '/color',
    // contentType: 'path without extension',
  },
  themeConfigFont: {
    metaName: 'theme-config-font',
    fallbackContent: '/font',
    // contentType: 'path without extension',
  },
  themeConfigFontFiles: {
    metaName: 'theme-config-fontface',
    fallbackContent: '/fonts/index',
    // contentType: 'path without extension',
  },
  themeConfigLayout: {
    metaName: 'theme-config-layout',
    fallbackContent: '/layout',
    // contentType: 'path without extension',
  },
  themeConfigComponent: {
    metaName: 'theme-config-component',
    fallbackContent: '/components-config',
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

// retrieve data from excel json format
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
  const { getArray = false, divider = ',', getFallback = true } = settings || {};
  const meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    if (getFallback) {
      const fallback = Object.values(metaTags).find(({ metaName }) => metaName === name)?.fallbackContent;
      return getArray ? stringToArray(fallback, { divider }) : fallback;
    }
    return getArray ? [] : null;
  }

  const val = stringToJsVal(meta.content);

  return getArray ? stringToArray(val, { divider }) : val;
}

export function getMetaGroup(group, settings) {
  const { getFallback = true, getArray = false, divider = ',' } = settings || {};

  const prefix = `${group}-`;
  const metaGroup = [...document.querySelectorAll(`meta[name^="${prefix}"]`)];

  if (getFallback) {
    const metaKeys = Object.values(metaTags).filter(
      ({ metaName }) => metaName?.startsWith(prefix) && !metaGroup.some((meta) => meta.name === metaName),
    );
    const defaultMeta = metaKeys.map(({ metaName, fallbackContent }) => ({ name: metaName, content: fallbackContent }));
    metaGroup.push(...defaultMeta);
  }

  return metaGroup.map((meta) => {
    const val = stringToJsVal(meta.content);
    return {
      nameWithPrefix: meta.name,
      name: meta.name.replace(new RegExp(`^${prefix}`), ''),
      content: getArray ? stringToArray(val, { divider }) : val,
    };
  });
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
        const noKeyInOrigin = !origin[key];
        // overwrite origin non object values with objects
        const overwriteOriginWithObject = !isOnlyObject(origin[key]) && isOnlyObject(merge[key]);
        if (noKeyInOrigin || overwriteOriginWithObject) {
          Object.assign(origin, { [key]: {} });
        }
        deepMerge(origin[key], merge[key]);
      } else {
        Object.assign(origin, { [key]: merge[key] });
      }
    });
  }

  return deepMerge(origin, ...toMerge);
}

/**
 * Helps handle the merging of non object prop values like string or arrays
 * by providing a key path and a method which defines how to handle the merge.
 *  @example
 * keyPathMethods: {
 *  '**.*': (a, b) => {}, // matches any key at any level. As an example by using a,b type checks can define general merging handling or all arrays properties.
 *  '**.class': (a, b) => {} // matches class key at any level
 *  '**.class|classes': (a, b) => {} // matches class or classes keys at any level
 *  '**.all|xs.class': (a, b) => {} // matches all.class or xs.class key paths at any level of nesting
 *  'all.class': (a, b) => {} // matches the exact key path nesting
 *  'all.class': (a, b) => {} // matches the exact key path nesting
 *  'all|xs.*.settings|config.*.class': (a, b) => { // matches class key at 5th level of nesting where '*' can be any
 *                                      } // key and first level is all and 3rd level si settings
 *  '*.*.*.class': (a, b) => {} // matches class key at 4th level of nesting where '*' can be any key
 *  '*.*.*.class': (a, b) => {} // matches class key at 4th level of nesting where '*' can be any key
 * }
 */
export function deepMergeMethod(keyPathMethods, origin, ...toMerge) {
  if (!toMerge.length) return origin;
  const merge = toMerge.shift();
  const pathsArrays =
    keyPathMethods?.pathsArrays ||
    Object.entries(keyPathMethods).flatMap(([key, method]) => {
      if (key === 'currentPath') return [];
      return [[key.split('.').map((k) => k.split('|')), method]];
    });
  const { currentPath = [] } = keyPathMethods;

  if (isOnlyObject(origin) && isOnlyObject(merge)) {
    Object.keys(merge).forEach((key) => {
      const localPath = [...currentPath, key];

      if (isOnlyObject(merge[key])) {
        const noKeyInOrigin = !origin[key];
        // overwrite origin non object values with objects
        const overwriteOriginWithObject = !isOnlyObject(origin[key]) && isOnlyObject(merge[key]);
        if (noKeyInOrigin || overwriteOriginWithObject) {
          Object.assign(origin, { [key]: {} });
        }
        deepMergeMethod({ pathsArrays, currentPath: localPath }, origin[key], merge[key]);
      } else {
        const extendByBath =
          !!pathsArrays.length &&
          pathsArrays.some(([keyPathPattern, method]) => {
            const keyPathCheck = [...keyPathPattern];
            const localPathCheck = [...localPath];

            if (keyPathCheck.at(0).at(0) === '**') {
              keyPathCheck.shift();
              if (localPathCheck.length > keyPathCheck.length) {
                localPathCheck.splice(0, localPathCheck.length - keyPathCheck.length);
              }
            }

            if (localPathCheck.length !== keyPathCheck.length) return false;

            const isPathMatch = localPathCheck.every((k, i) =>
              keyPathCheck[i].some((check) => k === check || check === '*'),
            );
            if (!isPathMatch) return false;
            Object.assign(origin, { [key]: method(origin[key], merge[key]) });
            return true;
          });

        if (!extendByBath) {
          Object.assign(origin, { [key]: merge[key] });
        }
      }
    });
  }

  return deepMergeMethod({ pathsArrays, currentPath }, origin, ...toMerge);
}

export function loadModule(urlWithoutExtension, loadCSS = true) {
  try {
    const js = import(`${urlWithoutExtension}.js`);
    if (!loadCSS) return { js, css: Promise.resolve() };
    const css = new Promise((resolve, reject) => {
      const cssHref = `${urlWithoutExtension}.css`;
      if (!document.querySelector(`head > link[href="${cssHref}"]`)) {
        const link = document.createElement('link');
        link.href = cssHref;
        // make the css loading not be render blocking
        link.rel = 'preload';
        link.as = 'style';
        link.onload = () => {
          link.onload = null;
          link.rel = 'stylesheet';
          resolve();
        };
        link.onerror = reject;
        document.head.append(link);
      } else {
        resolve();
      }
    }).catch((error) =>
      // eslint-disable-next-line no-console
      console.log('Could not load module style', urlWithoutExtension, error),
    );

    return { css, js };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Could not load module', urlWithoutExtension, error);
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

export function flatAsClasses(data, sep = '-') {
  return Object.entries(data)
    .reduce((acc, [key, value]) => {
      const accm = acc ? `${acc} ` : '';
      if (isObject(value)) {
        const flatSubValues = flatAsClasses(value, sep);
        // add current key as prefix to sublevel flatten values
        const valuesWithKey = flatSubValues.replace(/^|\s/g, ` ${key}${sep}`).trim();
        return `${accm}${valuesWithKey}`;
      }
      return `${accm}${key}${sep}${value}`;
    }, '')
    .trim();
}

/**
 * unFlattenProperties: convert objects from subkeys as strings {'a-b-c-d':1} to tree {a:{b:{c:{d:1}}}}
 *
 * @param {Object} obj - Object to unflatten
 * */
export function unFlat(f, settings = {}) {
  const { separatorAliases = [['+', '-']], keySeparator = '-' } = settings;
  const un = {};
  // for each key create objects
  Object.keys(f).forEach((key) => {
    const properties = key.split(keySeparator);
    const value = f[key];

    properties.reduce((unflating, prop, i) => {
      const newProp = separatorAliases.reduce((acc, p) => acc.replaceAll(...p), prop);
      if (!unflating[newProp]) {
        const step = i < properties.length - 1 ? { [newProp]: {} } : { [newProp]: value };
        Object.assign(unflating, step);
      }

      return unflating[newProp];
    }, un);
  });
  return un;
}

export const classToFlat = (classes = [], valueLength = 1, extend = {}) =>
  unFlat(
    classes.reduce((acc, c) => {
      const length = c.split('-').length - valueLength;
      const key = c.split('-').slice(0, length).join('-');
      const value = c.split('-').slice(length).join('-');
      if (!acc[key]) acc[key] = {};
      acc[key] = value;
      return acc;
    }, extend),
  );

export function blockBodyScroll(boolean) {
  const { noScroll } = globalConfig.classes;
  document.body.classList.toggle(noScroll, boolean);
}

// Separate any other blocks from grids and grid-item because:
// grids must be initialized only after all the other blocks are initialized
// grid-item component are going to be generated and initialized by the grid component and should be excluded from blocks.
export function getBlocksAndGrids(elements) {
  const blocksAndGrids = elements.reduce(
    (acc, block) => {
      // exclude grid items
      if (block.componentName === 'grid-item') return acc;
      if (block.componentName === 'grid') {
        // separate grids
        acc.grids.push(block);
      } else {
        // separate the rest of blocks
        acc.blocks.push(block);
      }
      return acc;
    },
    { grids: [], blocks: [] },
  );

  // if a grid doesn't specify its level will default to level 1
  const getGridLevel = (elem) => {
    const levelClass = [...elem.classList].find((cls) => cls.startsWith('data-level-')) || 'data-level-1';
    return Number(levelClass.slice('data-level-'.length));
  };

  // Based on how each gird is identifying it's own grid items, the grid initialization
  // must be done starting from the deepest level grids.
  // This is because each grid can contain other grids in their grid-items
  // To achieve this infinite nesting each grid deeper than level 1 must specify their level of
  // nesting with the data-level= option e.g data-level=2
  blocksAndGrids.grids.sort(({ targets: [elemA] }, { targets: [elemB] }) => {
    const levelA = getGridLevel(elemA);
    const levelB = getGridLevel(elemB);
    if (levelA <= levelB) return 1;
    if (levelA > levelB) return -1;
    return 0;
  });

  return blocksAndGrids;
}
