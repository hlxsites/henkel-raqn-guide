import { generateVirtualDom, renderVirtualDom } from './render/dom.js';
import { pageManipulation, templateManipulation } from './render/dom-manipulations.js';
import { getMeta, metaTags, runTasks, isTemplatePage, previewModule } from './libs.js';

await previewModule(import.meta);

export default {
  init() {
    runTasks.call(
      this, // all the tasks bellow will be bound to this object when called.
      null,
      this.generatePageVirtualDom,
      this.pageVirtualDomManipulation,
      this.loadAndProcessTemplate,
      this.renderPage,
    );
  },

  generatePageVirtualDom() {
    window.raqnVirtualDom = generateVirtualDom(document.body.childNodes);
    document.body.innerHTML = '';
  },

  async pageVirtualDomManipulation() {
    await pageManipulation(window.raqnVirtualDom);
  },

  renderPage() {
    const renderedDOM = renderVirtualDom(window.raqnVirtualDom);

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
    window.raqnTplVirtualDom = generateVirtualDom(element.childNodes);
    return window.raqnTplVirtualDom;
  },

  async templateVirtualDomManipulation({ templateVirtualDom }) {
    await templateManipulation(templateVirtualDom);
  },
}.init();
