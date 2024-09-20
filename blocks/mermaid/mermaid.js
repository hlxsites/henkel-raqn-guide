import ComponentBase from '../../scripts/component-base.js';
// eslint-disable-next-line import/extensions
import mermaid from './libs/mermaid.esm.min.mjs';

mermaid.initialize({
  logLevel: 'warn',
});

export default class Mermaid extends ComponentBase {
  ready() {
    const code = this.querySelector('code');
    if(!code) {
      throw new Error('Cannot initialize mermaid without code content.');
    }
    code.textContent = code.textContent.replace(/:\n/g, ': \n');
    mermaid.run({ nodes: [code] });
  }
}
