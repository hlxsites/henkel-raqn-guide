/**
 *
 * Very simple message/pubsub implementation with singleton storage.
 */

window.nc ??= {};
window.nc.actions ??= {};
const { actions } = window.nc;

export const subscribe = (message, action, options = {}) => {
  const { scope = null } = options;

  if (scope) {
    (scope.activeSubscriptions ??= []).push({ message, action });
  }

  if (actions[message]) {
    actions[message].push(action);
  } else {
    actions[message] = [action];
  }
};

export const unsubscribe = (message, action, options = {}) => {
  const { scope = null } = options;

  if (scope) {
    let toRemoveFromScope = -1;
    (scope.activeSubscriptions ??= []).find((sub, i) => {
      if (sub.message === message && sub.action === action) {
        toRemoveFromScope = i;
      }
    });
    if (toRemoveFromScope > -1) {
      scope.activeSubscriptions.splice(toRemoveFromScope, 1);
    }
  }

  if (actions[message]) {
    const toRemove = actions[message].indexOf(action);
    actions[message].splice(toRemove, 1);
  }
};

export const unsubscribeAll = (options = {}) => {
  const { message, scope = null, exactFit = true } = options;

  if (scope) {
    scope.activeSubscriptions.forEach(({ message: scopeMessage, action }) => {
      unsubscribe(scopeMessage, action);
    });
    scope.activeSubscriptions = [];
    return;
  }

  Object.keys(actions).forEach((key) => {
    if (exactFit ? key === message : key.includes(message)) {
      delete actions[key];
    }
  });
};

export const callStack = (message, params, options) => {
  const { targetOrigin = window.origin, callStackAscending = true } = options;

  if (!['*', window.origin].includes(targetOrigin)) return;

  if (actions[message]) {
    const messageCallStack = Array.from(actions[message]); // copy array
    // call all actions by last one registered
    let prevent = false;

    // Some current usages of `publish` are not passing `params` as an object.
    // For these cases the option to `stopImmediatePropagation` will not be available.
    if (params && typeof params === 'object' && !Array.isArray(params)) {
      params.stopImmediatePropagation = () => {
        prevent = true;
      };
    }

    // run the call stack unless `stopImmediatePropagation()` was called in previous action (prevent further actions to run)
    const callStackMethod = callStackAscending ? 'shift' : 'pop';
    while (!prevent && messageCallStack.length > 0) {
      const action = messageCallStack[callStackMethod]();
      action(params);
    }
  }
};

export const postMessage = (message, params, options = {}) => {
  const { usePostMessage = false, targetOrigin = window.origin } = options;
  if (!usePostMessage) return;

  let data = { message };
  try {
    data = { message, params: JSON.parse(JSON.stringify(params)) };
  } catch (error) {
    // some objects cannot be passed by post messages like when passing htmlElements.
    // for those that can be published but are not compatible with postMessages we don't send params
    // eslint-disable-next-line no-console
    console.warn(error);
  }
  // upward message
  window.parent.postMessage(data, targetOrigin);
  // downward message
  window.postMessage(data, targetOrigin);
};

export const publish = (message, params, options = {}) => {
  const { usePostMessage = false } = options;
  if (!usePostMessage) {
    callStack(message, params, options);
    return;
  }
  console.log('postMessage', message);

  postMessage(message, params, options);
};

if (!window.messageListenerAdded) {
  window.messageListenerAdded = true;
  window.addEventListener('message', (e) => {
    if (e && e.data) {
      const { message, params } = e.data;
      if (message && !Array.isArray(params)) {
        callStack(message, params, e.origin);
      }
    }
  });
}
