import Column from '../column/column.js';

export default class Navigation extends Column {
  createButton() {
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Menu');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'navigation');
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('type', 'button');
    button.setAttribute('tabindex', '0');
    button.innerHTML = `<raqn-icon icon=menu></raqn-icon>`;
    button.addEventListener('click', () => {
      this.classList.toggle('active');
      button.setAttribute('aria-expanded', this.classList.contains('active'));
    });
    return button;
  }

  render() {
    this.compact = this.getAttribute('compact') === 'true' || false;
    this.icon = this.getAttribute('icon') || 'menu';
    console.log('render', this.compact, this.getAttribute('compact'));
    if (this.compact) {
      this.appendChild(this.createButton());
    }
  }
}
