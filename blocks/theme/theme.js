import { ComponentBase } from "../../scripts/component-base.js";

export default class Theme extends ComponentBase {
    external = 'theme.json';
    allowedVariables = ['color', 'background', 'margin', 'font-size','font-weight', 'font-family'];
    headingVariables = ['font-size','font-weight', 'font-family'];

    createVariables() {
        const data = this.themeJson.data;
        const excludeFromVars = ['tag', 'name', 'description'];
        const keys = Object.keys(data[0]).filter(key => this.allowedVariables.includes(key));
        this.tags = data.map(item => {
            console.log(item);
            if (item['font-tag']) {
                return `
                ${item['font-tag']} {${keys.map(key => {
                        if (this.headingVariables.includes(key) && item[key]) {item[key]
                            return `
                            ${key}: var(--scope-${key},${item[key]});
                            `;
                        }
                    }).join('')}}
                `;
            }
            return '';
        }).join('').trim();
        this.variables = {}
        data.reduce((acc, item, index) => {
            keys.forEach(key => {
                if (item[key]) {
                    acc[`${key}-${index}`] = {
                        value: item[key],
                        scope: key
                    };
                }
            });
            return acc;
        }, this.variables);
    }

    styles() {
        console.log('render', this);    
        console.log('Theme', this.tags);
        this.innerHTML = `
        <style>
        body {
            ${Object.keys(this.variables).map((key,i) => `--raqn-${key}: ${this.variables[key].value};`).join('\n')}
        }
        ${Object.keys(this.variables).map((key,i) => `.${key} { --scope-${this.variables[key].scope}: ${this.variables[key].value}; }`).join('\n')}

        ${this.tags}
        </style>
        `

        document.body.style.display = 'block';
    }

    async processExternal(response) {
        if (response.ok) {
            this.themeJson = await response.json();
            console.log(this);
            this.createVariables()
            this.styles();
        }
    }
}