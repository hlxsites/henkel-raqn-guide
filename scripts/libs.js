export const config = {
  semanticBlocks: ['header', 'footer'],
  breakpoints: {
    s: 0,
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

export function getBreakPoints() {
  window.raqnBreakpoints = window.raqnBreakpoints || {};
  const breakpoints = Object.keys(config.breakpoints);
  window.raqnBreakpoints = breakpoints.filter(
    (bp) => matchMedia(`(min-width: ${config.breakpoints[bp]}px)`).matches,
  );
  return window.raqnBreakpoints;
}

export function getBreakPoint() {
  const b = getBreakPoints();
  return b[b.length - 1];
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

export function collectParams(blockName, classes, mixins, knownAttributes) {
  const mediaParams = {};
  const allKnownAttributes = [
    ...(knownAttributes || []),
    ...mixins.map((mixin) => mixin.observedAttributes || []).flat(),
  ];
  return {
    ...Array.from(classes)
      .filter((c) => c !== blockName && c !== 'block')
      .reduce((acc, c) => {
        let value = c;
        const breakpoint = Object.keys(config.breakpoints).find((breakpoint) => c.startsWith(`${breakpoint}-`));
        if(breakpoint) {
          if(breakpoint === getBreakPoint()) {
            value = value.slice(breakpoint.length + 1);  
          } else {
            // skip as param applies only for a different breakpoint
            return acc;
          }
        }

        // known attributes will be set directly to the element, all other classes will stay in the class attribute
        let key = 'class';
        if(value.startsWith(key)) {
          value = value.slice(key.length + 1);
        } else {
          const knownAttribute = allKnownAttributes.find((attribute) => value.startsWith(`${attribute}-`));
          if(knownAttribute) {
            key = knownAttribute;
            value = value.slice(knownAttribute.length + 1);
          }
        }

        // media params always overwrite
        if(breakpoint) {
          mediaParams[key] = value;
        } else {
          // support multivalue attributes
          if (acc[key]) {
            acc[key] += ` ${value}`;
          } else {
            acc[key] = value;
          }
        }
        return acc;
      }, {}),
    ...mediaParams,
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
  }).catch(() =>
    // eslint-disable-next-line no-console
    console.trace(`could not load module style`, urlWithoutExtension),
  );

  return { css, js };
}
