import ComponentBase from '../../scripts/component-base.js';

export default class BreadCrumbs extends ComponentBase {
  capitalize(string) {
    return string
      .split('-')
      .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
      .join(' ');
  }

  ready() {
    this.classList.add('full-width');
    this.classList.add('breadcrumbs');
    this.path = window.location.pathname.split('/');
    this.innerHTML = `
    <ul>
        ${this.path
          .map((path, index) => {
            if (path === '') {
              return `<li><a href="/${path}">Home</a></li>`;
            }
            if (index === this.path.length - 1) {
              return `<li>${this.capitalize(path)}</li>`;
            }
            const href = this.path.slice(0, index + 1).join('/');
            return `<li><a href="${href}">${this.capitalize(path)}</a></li>`;
          })
          .join('<li class="separator">›</li>')}
    <ul>`;
  }
}
