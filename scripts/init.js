import { ComponentLoader } from './component-loader.js';

export const config = {
    elementBlocks: ['header', 'footer'],
};

export function retriveDataFrom(blocks) {
    return blocks.map((block) => {
        let element = block;
        const tagName = element.tagName.toLowerCase();
        let blockName = tagName;
        if (!config.elementBlocks.includes(tagName)) {
            blockName = element.classList[0];
            element = document.createElement('div');
            block.append(element);
        }
        return {
            blockName,
            element,
        };
    });
}

export function init(element = document) {
    document.body.style.display = 'none';
    let blocks = Array.from(element.querySelectorAll('[class]'));
    if (element === document) {
        const header = element.querySelector('header');
        const footer = element.querySelector('footer');
        blocks = [header,...blocks,footer];
    } 
    
    const data = retriveDataFrom(blocks);
    Promise.all(data.map(({blockName, element}) => {
        const loader = new ComponentLoader(blockName, element);
        return loader.decorate();
    })).then(() => {
        document.body.style.display = 'block';
    });
}

window.loaderData = config;
init();