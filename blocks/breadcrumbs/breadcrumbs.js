import ComponentBase from '../../scripts/component-base.js';

export default class BreadCrumbs extends ComponentBase {
  ready() {
    this.path = window.location.pathname.split('/');
    this.classList.add('breadcrumbs');
    this.innerHTML = `
    <ul>
        ${this.path
          .map((path, index) => {
            if (path === '') {
              return `<li><a href="/${path}">home</a></li>`;
            }
            if (index === this.path.length - 1) {
              return `<li>${path}</li>`;
            }
            const href = this.path.slice(0, index + 1).join('/');
            return `<li><a href="${href}">${path}</a></li>`;
          })
          .join('<li class="separator">/</li>')}
    <ul>`;
  }
}
