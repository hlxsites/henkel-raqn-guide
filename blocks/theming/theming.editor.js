import { MessagesEvents } from '../../scripts/editor.js';
import { publish } from '../../scripts/pubsub.js';
import Theming from './theming.js';

let listener = false;
let themeInstance = null;

export default function config() {
  // init editor if message from parent
  if (!listener) {
    [themeInstance] = window.raqnInstances[Theming.name.toLowerCase()];

    publish(
      MessagesEvents.theme,
      { name: 'theme', data: themeInstance.themeJson },
      { usePostMessage: true, targetOrigin: '*' },
    );

    listener = true;
    window.addEventListener('message', (e) => {
      if (e && e.data) {
        const { message, params } = e.data;
        if (message && message === MessagesEvents.themeUpdate) {
          [themeInstance] = window.raqnInstances[Theming.name.toLowerCase()];
          const { name, data } = params;
          const keys = Object.keys(data);
          const themeKeys = Object.keys(data[keys[0]]).slice(1);
          const t = data;
          themeInstance.variables = '';
          themeInstance.themes = '';
          themeInstance.tags = '';

          themeInstance.getTheme(themeKeys, keys, t, name);
          if (name === 'font') {
            themeInstance.prepareTags(keys, themeKeys, t);
          }

          themeInstance.styles();
        }
      }
    });
  }
  return {
    variables: {},
  };
}
