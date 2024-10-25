import { MessagesEvents } from '../../scripts/editor.js';
import { readValue } from '../../scripts/libs.js';
import { publish } from '../../scripts/pubsub.js';

let listener = false;
let themeInstance = null;

export default function config() {
  // init editor if message from parent
  if (!listener) {
    const name = 'raqn-theming';
    [themeInstance] = window.raqnInstances[name];

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
          [themeInstance] = window.raqnInstances[name];
          const { data } = params;
          const row = Object.keys(data).map((key) => data[key]);
          readValue(row, themeInstance.variations);
          themeInstance.defineVariations(readValue(row, themeInstance.variations));
          themeInstance.styles();
        }
      }
    });
  }
  return {
    variables: {},
  };
}
