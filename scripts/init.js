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
        } else {
            element = document.createElement('div');
            block.append(element);
        }
        return {
            blockName,
            element,
        };
    });
}

export async function init(element = document) {
    let blocks = Array.from(element.querySelectorAll('[class]:not([class^=raqn]'));
    console.log(blocks);
    if (element === document) {
        const header = element.querySelector('header');
        const footer = element.querySelector('footer');
        blocks = [header,...blocks,footer];
    } 
    
    const data = retriveDataFrom(blocks);
    Promise.all(data.map(({blockName, element}) => {
        console.log(blockName, element);
        const loader = new ComponentLoader(blockName, element);
        return loader.decorate();
    }))
}

window.loaderData = config;
init();