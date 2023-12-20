

export class ComponentLoader {
    constructor(blockName, element) {
        console.log('ComponentLoader', blockName, element);
        window.raqnComponents = window.raqnComponents || {};
        this.block = element;
        this.blockName = blockName;
        this.setBlockPaths();
        this.setParams();
        this.content = this.block.children;
    }

    /**
     * Loads a CSS file.
     * @param {string} href URL to the CSS file
     */
    async loadCSS(href) {
        return new Promise((resolve, reject) => {
        if (!document.querySelector(`head > link[href="${href}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.append(link);
        } else {
            resolve();
        }
        });
    }

    /**
     * Parse extra params from classList
     */
    setParams() {
        this.params = Array.from(this.block.classList)
            .filter((c) => {
                console.log(c,this.blockName,  c !== this.blockName && c !== 'block');
                return c !== this.blockName && c !== 'block';
            })
            .reduce((acc, c) => {
                const values = c.split('-');
                const key = values.shift();
                if (acc[key] && Array.isArray(acc[key])) {
                    acc[key].push(values.join('-'));
                } else if (acc[key]) {
                    acc[key] = [acc[key], values.join('-')];
                } else {
                    acc[key] = values.join('-');
                }
                console.log(acc, key, values);
                return acc;
            }, {});
    }

    /**
     * Set the configuration for the given block, and also passes
     * the config through all custom patching helpers added to the project.
     *
     * @param {Element} block The block element
     * @returns {Object} The block config (blockName, cssPath and jsPath)
     */
     setBlockPaths() {
        this.cssPath = `/blocks/${this.blockName}/${this.blockName}.css`;
        this.jsPath = `/blocks/${this.blockName}/${this.blockName}.js`;
    }
    

    async decorate() {
        const status = this.block.dataset.blockStatus;
        if (status !== 'loading' && status !== 'loaded') {
            this.block.dataset.blockStatus = 'loading';
            try {
            const cssLoaded = this.loadCSS(this.cssPath);
            const decorationComplete = new Promise((resolve) => {
                (async () => {
                try {
                    const mod = await import(this.jsPath);
                    if (mod.default && mod.default.name && mod.default.name !== 'decorate') {
                        const name = mod.default.name;
                        const elementName = `raqn-${name.toLowerCase()}`;
                        // define the custom element if it doesn't exist
                        if (!window.raqnComponents[name]) {
                            const elementName = `raqn-${name.toLowerCase()}`;
                            const Contructor = mod.default
                            customElements.define(elementName, Contructor);
                            window.raqnComponents[name] = Contructor;
                        }
                        const element = document.createElement(elementName);
                        element.innerHTML = this.block.innerHTML;
                        this.block.replaceWith(element);
                        console.log('decorate', this.params);
                        Object.keys(this.params).forEach((key) => {
                            // @TODO sanitize
                            const value = Array.isArray(this.params[key]) ? this.params[key].join(' ') : this.params[key];
                            element.setAttribute(key, value);
                            console.log(key, value);
                        });
                        console.log('decorate', element);
                        
                    } else if (mod.default) {
                        await mod.default(this.block);
                    }
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.log(`failed to load module for ${this.blockName}`, error);
                }
                resolve();
                })();
            });
            
            return await Promise.all([cssLoaded, decorationComplete]);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.log(`failed to load block ${this.blockName}`, error);
            }
        }
    }
}
