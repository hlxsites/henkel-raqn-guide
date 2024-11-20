import { generateVirtualDom, renderVirtualDom } from './render/dom.js';
import {  pageManipulation, templateManipulation } from './render/dom-manipulations.js';
import { getMeta, metaTags, runTasks, isTemplatePage, previewModule, isPreview } from './libs.js';
import { subscribe } from './pubsub.js';

await previewModule(import.meta);

export default {
  init() {
    if (isPreview() && window.location.search.includes('previewOf')) {
      return runTasks.call(this, null, this.componentPreview);
    }
    return runTasks.call(
      this, // all the tasks bellow will be bound to this object when called.
      null,
      this.generatePageVirtualDom,
      this.pageVirtualDomManipulation,
      this.loadAndProcessTemplate,
      this.renderPage,
    );
  },
  componentPreview() {
    import('./component-preview.js');
  },
  generatePageVirtualDom() {
    window.raqnVirtualDom = generateVirtualDom(document.body);
    document.body.innerHTML = '';
  },

  async pageVirtualDomManipulation() {
    await pageManipulation(window.raqnVirtualDom);
  },

  renderPage() {
    console.log('rendering page', window.raqnVirtualDom);
    const renderedDOM = window.raqnVirtualDom.children.map(n => renderVirtualDom(n));

    if (renderedDOM) {
      document.body.append(...renderedDOM);
    }
  },

  async loadAndProcessTemplate() {
    // await for the tasks because this.templateContent is running async to fetch the template
    await runTasks(
      null,
      this.templatePath,
      this.templateContent,
      this.templateVirtualDom,
      this.templateVirtualDomManipulation,
    );
  },

  templatePath() {
    let tpl = getMeta(metaTags.template.metaName, { getFallback: false });
    const stop = { stopTaskRun: true, value: null };
    if (typeof tpl !== 'string' || !tpl.length) return stop;

    if (!tpl.includes('/')) {
      tpl = `${metaTags.template.fallbackContent}${tpl.trim()}`;
    }

    if (!isTemplatePage(tpl)) {
      // eslint-disable-next-line no-console
      console.error(
        `The configured template for this page is not in a "${metaTags.template.fallbackContent}" folder:`,
        `"${tpl}"`,
      );
      return stop;
    }

    const path = tpl.concat('.plain.html');

    return path;
  },

  async templateContent({ templatePath }) {
    if (!templatePath) return { stopTaskRun: true, value: null };
    const response = await fetch(
      `${templatePath}`,
      window.location.pathname.endsWith(templatePath) ? { cache: this.fragmentCache } : {},
    );
    if (!response.ok) return { stopTaskRun: true, value: null };
    const templateContent = await response.text();
    return templateContent;
  },

  templateVirtualDom({ templateContent }) {
    if (!templateContent) return { stopTaskRun: true, value: null };
    const element = document.createElement('div');
    element.innerHTML = templateContent;
    window.raqnTplVirtualDom = generateVirtualDom(element);
    return window.raqnTplVirtualDom;
  },

  async templateVirtualDomManipulation() {
    await templateManipulation(window.raqnTplVirtualDom);
  },
}.init().then(() => {
  subscribe('raqn:page:editor:load', () => import('./editor.js')); 
});

// // example of usage
// const dom = document.createElement('raqn-section');

// // consistency with virtual dom interface without the need to use createNode
// /*
//  *  createNode({
//  *   tag: 'raqn-section',
//  *   children: []
//  *  })
//  * 
// */

// // remove await from manipulate function
// // use a subscription on async subjects to wait if needed.

// // avoid N to N 

// console.log(generateVirtualDom([dom]),await generalManipulation(generateVirtualDom([dom])));

// console.log(renderVirtualDom(generalManipulation(generateVirtualDom([dom]))));