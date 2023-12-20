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
        this.connected();
        this.render();
    }

    async load(block) {
        const resp = await fetch(`${block}.plain.html`, window.location.pathname.endsWith(block) ? { cache: 'reload' } : {});

        if (resp.ok) {
            const html = await resp.text();
            console.log(this.innerHTML)
            this.innerHTML = html;
            init(this);
        }
    }

    connected() {
        console.log('connected', this);
    }

    render() {
        console.log('render', this);
    }
}

