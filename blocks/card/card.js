
export default class Card extends HTMLElement {
    constructor() {
        super();
        this.columns = this.getAttribute('columns');
        this.style.setProperty('--card-columns', new Array(this.columns).map(() => '1fr').join(' '));
    }
    
}