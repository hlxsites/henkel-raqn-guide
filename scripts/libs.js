export const config = {
  elementBlocks: ['header', 'footer'],
  breakpoints: {
    s: 0,
    m: 768,
    l: 1024,
    xl: 1280,
    xxl: 1920,
  },
};

export function getBreakPoint() {
  const breakpoints = Object.keys(config.breakpoints);
  const currentBreakpoint = breakpoints
    .filter(
      (bp) => matchMedia(`(min-width: ${config.breakpoints[bp]}px)`).matches,
    )
    .pop();
  return currentBreakpoint;
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
