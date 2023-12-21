import { init } from "./init.js";

export class ComponentBase extends HTMLElement {
    static observedAttributes = ["position", "size"];
    static dependencies = [];
    attributes = {};
    external = false;
    uuid = `gen${crypto.randomUUID().split('-')[0]}`;

    constructor() {
        super();
    }

    async connectedCallback() {
        this.setAttribute('id', this.uuid);
        if (this.external) {
            await this.load(this.external);
        }
        this.connected();
        this.render();
    }

    async load(block) {
        const response = await fetch(`${block}`, window.location.pathname.endsWith(block) ? { cache: 'reload' } : {});
        return this.processExternal(response);
    }

    async processExternal(response) {
        if (response.ok) {
            const html = await response.text();
            this.innerHTML = html;
            return init(this);
        } else {
            console.log(response);
        }
    }

    connected() {
        console.log('connected', this);
    }

    render() {
        console.log('render', this);
    }
}

