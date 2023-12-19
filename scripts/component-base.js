import { init } from "./init.js";


export class ComponentBase extends HTMLElement {
    external = false;
    constructor() {
        super();
    }
    async connectedCallback() {
        console.log('connectedCallback', this.external);
        if (this.external) {
            await this.load(this.external);
        }
        this.render();
    }

    async load() {
        const resp = await fetch(`${this.external}.plain.html`, window.location.pathname.endsWith(this.external) ? { cache: 'reload' } : {});

        if (resp.ok) {
            const html = await resp.text();
            console.log(this.innerHTML)
            this.innerHTML = html;
            init(this);
        }
    }

    render() {

    }
}

