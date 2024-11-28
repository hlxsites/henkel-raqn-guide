export const globalConfig = {
  semanticBlocks: ['header', 'footer'],
  blockSelector: `
  [class]:not(
    style,
    [class^="config-" i],
    [class^="grid-item" i]
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
  previewHosts: {
    localhost: 'localhost',
    review: 'aem.page',
  },
  isPreview: undefined,
};

export const metaTags = {
  basepath: {
    metaName: 'basepath',
    fallbackContent: window.location.origin,
  },
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
  template: {
    metaName: 'template',
    fallbackContent: '/page-templates/',
    // contentType: 'string template name and path defaults to fallbackContent - or the full path including template name',
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
    fallbackContent: '/configs/',
    // contentType: 'boolean string',
  },
  themeConfigColor: {
    metaName: 'theme-config-color',
    fallbackContent: '/configs/color',
    // contentType: 'path without extension',
  },
  themeConfigFont: {
    metaName: 'theme-config-font',
    fallbackContent: '/configs/font',
    // contentType: 'path without extension',
  },
  themeConfigFontFiles: {
    metaName: 'theme-config-fontface',
    fallbackContent: '/fonts/index',
    // contentType: 'path without extension',
  },
  themeConfigLayout: {
    metaName: 'theme-config-layout',
    fallbackContent: '/configs/layout',
    // contentType: 'path without extension',
  },
  componentsConfigs: {
    metaName: 'config-component',
    fallbackContent: '/configs/components-config',
    // contentType: 'path without extension',
  },
  theme: {
    metaName: 'theme',
    fallbackContent: 'color-default font-default',
    // contentType: 'string theme name',
  },
};

export const isPreview = () => {
  if (typeof globalConfig.isPreview !== 'undefined') return globalConfig.isPreview;

  const { hostname, searchParams } = new URL(window.location);
  const isDisabled = searchParams.has('raqnPreviewOff');
  if (isDisabled) {
    globalConfig.isPreview = !isDisabled;
    return globalConfig.isPreview;
  }
  const { previewHosts } = globalConfig;

  globalConfig.isPreview = Object.values(previewHosts).some((host) => hostname.endsWith(host));
  return globalConfig.isPreview;
};

export const isTemplatePage = (url) => (url || window.location.pathname).includes(metaTags.template.fallbackContent);

export const capitalizeCase = (val) => val.replace(/^[a-z]/g, (k) => k.toUpperCase());
export const camelCaseAttr = (val) => val.replace(/-([a-z])/g, (k) => k[1].toUpperCase());
export const capitalizeCaseAttr = (val) => camelCaseAttr(capitalizeCase(val));

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
    previousActive: null,
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
          breakpoints.previousActive = { ...e.previousRaqnBreakpoint };
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
export function deepMergeByType(keyPathMethods, origin, ...toMerge) {
  if (!toMerge.length) return origin;
  const merge = toMerge.shift();
  const keyPathMethodsCopy = keyPathMethods || {};
  const pathsArrays =
    keyPathMethodsCopy?.pathsArrays ||
    Object.entries(keyPathMethodsCopy).flatMap(([key, method]) => {
      if (key === 'currentPath') return [];
      return [[key.split('.').map((k) => k.split('|')), method]];
    });
  const { currentPath = [] } = keyPathMethodsCopy;

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
        deepMergeByType({ pathsArrays, currentPath: localPath }, origin[key], merge[key]);
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

  return deepMergeByType({ pathsArrays, currentPath }, origin, ...toMerge);
}

export function loadModule(urlWithoutExtension, { loadCSS = true, loadJS = true }) {
  const modules = { js: null, css: null };
  if (!urlWithoutExtension) return modules;

  if (loadJS) {
    modules.js = import(`${urlWithoutExtension}.js`).catch((error) => {
      // eslint-disable-next-line no-console
      console.log('Could not load module js', urlWithoutExtension, error);
      return error;
    });
  }

  if (loadCSS) {
    modules.css = new Promise((resolve, reject) => {
      const cssHref = `${urlWithoutExtension}.css`;
      const style = document.querySelector(`head > link[href="${cssHref}"]`);
      if (!style) {
        const link = document.createElement('link');
        link.href = cssHref;
        // make the css loading not be render blocking
        link.rel = 'preload';
        link.as = 'style';
        link.onload = () => {
          link.onload = null;
          link.rel = 'stylesheet';
          resolve(link);
        };
        link.onerror = reject;
        document.head.append(link);
      } else {
        resolve(style);
      }
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.log('Could not load module style', urlWithoutExtension, error);
      return error;
    });
  }

  return modules;
}

/**
 * When creating elements that require properties to be set on them
 * either await for this method when loading the component
 * or use `await customElements.whenDefined('component-tag');`
 * Otherwise properties set on the element before it was defined will be overwritten
 * with the defaults from the class.
 * This is not required for attributes.
 */
export async function loadAndDefine(componentConfig) {
  const { tag, module: { path, loadJS, loadCSS } = {} } = componentConfig;
  if (window.raqnComponents[tag]) {
    // fix 
    return { tag, module: await window.raqnComponents[tag] };
  }
  let resolveModule;
  window.raqnComponents[tag] = new Promise((resolve) => {
    resolveModule = resolve;
  });

  const { js } = loadModule(path, { loadJS, loadCSS });

  const module = await js;

  if (module?.default?.prototype instanceof HTMLElement) {
    if (!window.customElements.get(tag)) {
      window.customElements.define(tag, module.default);
      resolveModule(module.default);
    }
  }
  return { tag, module };
}

export function mergeUniqueArrays(...arrays) {
  const mergedArrays = arrays.reduce((acc, arr) => [...acc, ...(arr || [])], []);
  return [...new Set(mergedArrays)];
}

export function getBaseUrl() {
  const basepath = getMeta(metaTags.basepath.metaName);
  const base = document.head.querySelector('base');

  if (!base) {
    const element = document.createElement('base');
    element.href = basepath;
    document.head.append(element);
  }
  return basepath;
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

export function flat(obj = {}, alreadyFlat = '', sep = '.', maxDepth = 10) {
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

export function flatAsValue(data, sep = '.') {
  return Object.entries(data)
    .reduce((acc, [key, value]) => {
      if (isObject(value)) {
        return flatAsValue(value, acc);
      }
      return `${acc} ${key}${sep}${value}`;
    }, '')
    .trim();
}

export function flatAsClasses(data, sep = '.') {
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

export function unFlat(f, sep = '.') {
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

/**
 * Load a file used only for preview.
 * Adds an easy way to load inside a file the preview version of the same file with a .preview.js suffix,
 * using the `import.meta` as value for `path` param.
 *
 * @param {string|import.meta} path - The path including file name from where to load the preview file
 *                   If the file is in the same path as the current one where this method is called
 *                   then `import.meta` can be used as value
 * @param {string} name - the name of an export from the module.
 * @returns {module|*} - the module or a specific export from the module.
 */
export const previewModule = async (path, name) => {
  if (!isPreview()) return null;
  let newPath = path;
  if (path.url) {
    const localPath = path.url.split('.js');
    localPath.splice(1, 1, '.preview.js');
    newPath = localPath.join('');
  }
  const module = await import(newPath);
  return name ? module[name] : module;
};

/* Yield to the main thread */

export function yieldToMain() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Functions running complex computation have a potential to generate a task with high block time.
 *
 * To mitigate this issue the functionality should be splitted into multiple functions which
 * should be called using the runTasks() method.
 *
 * Functions called with runTasks() can further more use same technique
 * inside of them to break down the functionality into smaller tasks and call them using runTasks();
 *
 * Use call() or apply() methods to call the runTasks() method in order to set the thisArg for the tasks in the list.
 *
 * @param  {*} params - initial parameter accessible in all tasks calls under the `params` key.
 * @param  {...any} taskList - and succession of function to be called as tasks. The tasks can be async.
 * @returns {object} - contains all the results from all tasks calls where the key is the task function name including the initial params key.
 */
export async function runTasks(params, ...taskList) {
  const prevResults = {};
  let i = 0;
  prevResults.params = params;

  while (taskList.length > 0) {
    i += 1;
    const task = taskList.shift();

    // Run the task:
    let result = null;
    // eslint-disable-next-line no-await-in-loop
    result = await task.call(this, prevResults, i);

    if (!task.name.length) {
      // eslint-disable-next-line no-console
      console.warn("The task doesn't have a name. Please use a named function to create the task.");
    }
    if (result?.stopTaskRun) {
      result = result.value;
      taskList.splice(0, taskList.length);
    }
    prevResults[task.name || i] = result;

    // Yield to the main thread
    // eslint-disable-next-line no-await-in-loop
    await yieldToMain();
  }
  return prevResults;
}
