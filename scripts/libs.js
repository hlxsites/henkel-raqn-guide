export const globalConfig = {
  semanticBlocks: ['header', 'footer'],
  blockSelector: '[class]:not(style, [class^="config-" i])',
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
  theming: {
    metaName: 'theming',
    fallbackContent: 'theming.json',
    // contentType: 'path without extension',
  },
  theme: {
    metaName: 'theme',
    fallbackContent: 'theme-default',
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

export const externalConfig = {
  defaultConfig(rawConfig = []) {
    return {
      attributesValues: {},
      nestedComponentsConfig: {},
      props: {},
      config: {},
      rawConfig,
      hasBreakpointsValues: false,
    };
  },

  async getConfig(componentName, configName, knownAttributes) {
    if (!configName) return this.defaultConfig(); // to be removed in the feature and fallback to 'default'
    const masterConfig = await this.loadConfig();
    const componentConfig = masterConfig?.[componentName];
    let parsedConfig = componentConfig?.parsed?.[configName];
    if (parsedConfig) return parsedConfig;
    const rawConfig = componentConfig?.data.filter((conf) => conf.configName?.trim() === configName /* ?? 'default' */);
    if (!rawConfig?.length) {
      // eslint-disable-next-line no-console
      console.error(`The config named '${configName}' for '${componentName}' webComponent is not valid.`);
      return this.defaultConfig();
    }
    const safeConfig = JSON.parse(JSON.stringify(rawConfig));
    parsedConfig = this.parseRawConfig(safeConfig, knownAttributes);
    componentConfig.parsed ??= {};
    componentConfig.parsed[configName] = parsedConfig;

    return parsedConfig;
  },

  async loadConfig() {
    window.raqnComponentsConfig ??= (async () => {
      const { metaName, fallbackContent } = metaTags.componentsConfig;
      const metaConfigPath = getMeta(metaName);
      const configPath = (!!metaConfigPath && `${metaConfigPath}.json`) || `${fallbackContent}.json`;
      let result = null;
      try {
        const response = await fetch(`${configPath}`);
        if (response.ok) {
          result = await response.json();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
      return result;
    })();

    window.raqnComponentsConfig = await window.raqnComponentsConfig;

    return window.raqnComponentsConfig;
  },

  parseRawConfig(configArr, knownAttributes) {
    const parsedConfig = configArr?.reduce((acc, breakpointConfig) => {
      const breakpoint = breakpointConfig.viewport.toLowerCase();
      const isMainConfig = breakpoint === 'all';

      Object.entries(breakpointConfig).forEach(([key, val]) => {
        if (val.trim() === '') return;
        if (![...Object.keys(globalConfig.breakpoints), 'all'].includes(breakpoint)) return;
        if (!isMainConfig) acc.hasBreakpointsValues = true;

        const parsedVal = stringToJsVal(val, { trim: true });

        if (knownAttributes.includes(key) || key === 'class') {
          this.parseAttrValues(parsedVal, acc, key, breakpoint);
        } else if (isMainConfig) {
          const configPrefix = 'config-';
          const propPrefix = 'prop-';
          if (key.startsWith(configPrefix)) {
            this.parseConfig(parsedVal, acc, key, configPrefix);
          } else if (key.startsWith(propPrefix)) {
            acc.props[key.slice(propPrefix.length)] = parsedVal;
          } else if (key === 'nest') {
            this.parseNestedConfig(val, acc);
          }
        }
      });
      return acc;
    }, this.defaultConfig(configArr));

    return parsedConfig;
  },

  parseAttrValues(parsedVal, acc, key, breakpoint) {
    const keyProp = key.replace(/^data-/, '');
    const camelAttr = camelCaseAttr(keyProp);
    acc.attributesValues[camelAttr] ??= {};
    acc.attributesValues[camelAttr][breakpoint] = parsedVal;
  },

  parseConfig(parsedVal, acc, key, configPrefix) {
    const configKeys = key.slice(configPrefix.length).split('.');
    const indexLength = configKeys.length - 1;
    configKeys.reduce((cof, confKey, index) => {
      cof[confKey] = index < indexLength ? {} : parsedVal;
      return cof[confKey];
    }, acc.config);
  },

  parseNestedConfig(val, acc) {
    const parsedVal = stringToArray(val).reduce((nestConf, confVal) => {
      const [componentName, activeOrConfigName] = confVal.split('=');
      const parsedActiveOrConfigName = stringToJsVal(activeOrConfigName);
      const isString = typeof parsedActiveOrConfigName === 'string';
      nestConf[componentName] ??= {
        componentName,
        externalConfigName: isString ? parsedActiveOrConfigName : null,
        active: isString || parsedActiveOrConfigName,
      };
      return nestConf;
    }, {});
    acc.nestedComponentsConfig = parsedVal;
  },
};

export const configFromClasses = {
  getConfig(componentName, configByClasses, knownAttributes) {
    const nestedComponentsConfig = this.nestedConfigFromClasses(configByClasses);
    const { attributesValues, hasBreakpointsValues } = this.attributeValuesFromClasses(
      componentName,
      configByClasses,
      knownAttributes,
    );
    return {
      attributesValues,
      nestedComponentsConfig,
      hasBreakpointsValues,
    };
  },

  nestedComponentsNames(configByClasses) {
    const nestPrefix = 'nest-'; //

    return configByClasses.flatMap((c) => (c.startsWith(nestPrefix) ? [c.slice(nestPrefix.length)] : []));
  },

  nestedConfigFromClasses(configByClasses) {
    const nestedComponentsNames = this.nestedComponentsNames(configByClasses);
    const nestedComponentsConfig = configByClasses.reduce((acc, c) => {
      let value = c;

      const classBreakpoint = this.classBreakpoint(c);
      const isBreakpoint = this.isBreakpoint(classBreakpoint);

      if (isBreakpoint) value = value.slice(classBreakpoint.length + 1);

      const componentName = nestedComponentsNames.find((prefix) => value.startsWith(prefix));
      if (componentName) {
        acc[componentName] ??= { componentName, active: true };
        const val = value.slice(componentName.length + 1);
        const active = 'active-';
        if (val.startsWith(active)) {
          acc[componentName].active = stringToJsVal(val.slice(active.length));
        } else {
          acc[componentName].configByClasses ??= '';
          acc[componentName].configByClasses += `${isBreakpoint ? `${classBreakpoint}-` : ''}${val} `;
        }
      }
      return acc;
    }, {});
    return nestedComponentsConfig;
  },

  attributeValuesFromClasses(componentName, configByClasses, knownAttributes) {
    let hasBreakpointsValues = false;
    const nestedComponentsNames = this.nestedComponentsNames(configByClasses);
    const onlyKnownAttributes = knownAttributes.filter((a) => a !== 'class');
    const attributesValues = configByClasses
      .filter((c) => c !== componentName && c !== 'block')
      .reduce((acc, c) => {
        let value = c;
        let isKnownAttribute = null;

        const classBreakpoint = this.classBreakpoint(c);
        const isBreakpoint = this.isBreakpoint(classBreakpoint);

        if (isBreakpoint) {
          hasBreakpointsValues = true;
          value = value.slice(classBreakpoint.length + 1);
        }

        const excludeNested = nestedComponentsNames.find((prefix) => value.startsWith(prefix));
        if (excludeNested) return acc;

        let key = 'class';
        const isClassValue = value.startsWith(key);
        if (isClassValue) {
          value = value.slice(key.length + 1);
        } else {
          [isKnownAttribute] = onlyKnownAttributes.flatMap((attribute) => {
            const noDataPrefix = attribute.replace(/^data-/, '');
            if (!value.startsWith(`${noDataPrefix}-`)) return [];
            return noDataPrefix;
          });
          if (isKnownAttribute) {
            key = isKnownAttribute;
            value = value.slice(isKnownAttribute.length + 1);
          }
        }

        const isClass = key === 'class';
        const camelCaseKey = camelCaseAttr(key);
        if (isKnownAttribute || isClass) acc[camelCaseKey] ??= {};
        if (isKnownAttribute) acc[camelCaseKey][classBreakpoint] = value;
        if (isClass) {
          acc[camelCaseKey][classBreakpoint] ??= '';
          acc[camelCaseKey][classBreakpoint] += `${value} `;
        }
        return acc;
      }, {});

    return { attributesValues, hasBreakpointsValues };
  },
  classBreakpoint(c) {
    return Object.keys(globalConfig.breakpoints).find((b) => c.startsWith(`${b}-`)) || 'all';
  },
  isBreakpoint(classBreakpoint) {
    return classBreakpoint !== 'all';
  },
};

export async function buildConfig(componentName, externalConf, configByClasses, knownAttributes = []) {
  const configPrefix = 'config-';
  let config;
  const externalConfigName =
    configByClasses.find((c) => c.startsWith(configPrefix))?.slice?.(configPrefix.length) || externalConf;

  if (externalConfigName) {
    config = await externalConfig.getConfig(componentName, externalConfigName, knownAttributes);
  } else {
    config = configFromClasses.getConfig(componentName, configByClasses, knownAttributes);
  }

  return config;
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

/**
 * flattenProperties: convert objects from {a:{b:{c:{d:1}}}} to all subkeys as strings {'a.b.c.d':1}
 *
 * @param {Object} obj - Object to flatten
 * @param {String} alreadyFlat - prefix or recursive keys.
 * */

export function flat(obj = {}, alreadyFlat = '', sep = '-') {
  const f = {};
  // check if its a object
  Object.keys(obj).forEach((k) => {
    // get the value
    const value = obj[k].valueOf() || obj[k];
    // append key to already flatten Keys
    const key = `${alreadyFlat ? `${alreadyFlat}${sep}` : ''}${k}`;
    // if still a object fo recursive
    if (isObject(value)) {
      Object.assign(f, flat(value, key));
    } else {
      // there is a real value so add key to flat object
      f[key] = value;
    }
  });
  return f;
}

/**
 * unFlattenProperties: convert objects from subkeys as strings {'a.b.c.d':1} to tree {a:{b:{c:{d:1}}}}
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
