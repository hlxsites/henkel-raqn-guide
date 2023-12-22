import { ComponentBase } from "../../scripts/component-base.js";

export default class Icon extends ComponentBase {
    constructor() {
        super();
        this.setupSprite();
    }

    setupSprite() {
        this.svgSprite = document.getElementById('franklin-svg-sprite');
        if (!this.svgSprite) {
            this.svgSprite = document.createElement('div');
            this.svgSprite.id ="franklin-svg-sprite";
            document.body.append(this.svgSprite);
        }
    }
    get cache() {
        window.ICONS_CACHE = window.ICONS_CACHE || {};
        return window.ICONS_CACHE;
    }

    get iconUrl() {
        return `assets/icons/${this.iconName}.svg`;
    }
    
    async connected() {
        this.iconName = this.getAttribute('icon');
        if (!this.cache[this.iconName]) {
            this.cache[this.iconName] = {
                loading: new Promise(async (resolve, reject) => {
                    resolve(await this.load(this.iconUrl));
                })
            }
            
        } else {
            await this.cache[this.iconName].loading;
            this.innerHTML = this.template();
        }
        this.classList.add('loaded');
    }

    template() {
        const {viewBox} = this.cache[this.iconName];
        const attributes = Object.keys({viewBox}).map((k) => this.cache[this.iconName][k] ? `${k}="${this.cache[this.iconName][k]}"` : '').join(' ');
        return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ${attributes}><use xlink:href="#icons-sprite-${this.iconName}"/></svg>`;
    }

    async processExternal(response) {
        if (response.ok) {
            const {iconName} = this;
            this.svg = await response.text();

            if (this.svg.match(/(<style | class=|url\(#| xlink:href="#)/)) {
            ICONS_CACHE[iconName] = {
                styled: true,
                html: this.svg
                // rescope ids and references to avoid clashes across icons;
                .replaceAll(/ id="([^"]+)"/g, (_, id) => ` id="${iconName}-${id}"`)
                .replaceAll(/="url\(#([^)]+)\)"/g, (_, id) => `="url(#${iconName}-${id})"`)
                .replaceAll(/ xlink:href="#([^"]+)"/g, (_, id) => ` xlink:href="#${iconName}-${id}"`),
            };
            } else {
                const dummy = document.createElement('div');
                dummy.innerHTML = this.svg; 
                const svg = dummy.querySelector('svg');
                const innerHTML = svg.innerHTML;
                console.log('processExternal', svg);
                const width = svg.getAttribute('width');
                const height = svg.getAttribute('height');
                const viewBox = svg.getAttribute('viewBox');

                console.log('processExternal', width, height, viewBox);
                
                svg.innerHTML = `<defs><g id="icons-sprite-${iconName}" viewBox="${viewBox}" width="${width}" height="${height}">${innerHTML}</g></defs>`;
                this.cache[iconName].svg = svg;
                this.cache[iconName].width = width;
                this.cache[iconName].height = height;
                this.cache[iconName].viewBox = viewBox;
            }
            this.svgSprite.append(this.cache[iconName].svg);
            this.innerHTML = this.template();
        } else {
            this.cache[this.iconName] = false;
        }
    }
}
// /**
//  * Replace icons with inline SVG and prefix with codeBasePath.
//  * @param {Element} [element] Element containing icons
//  */
// export async function decorateIcons(element) {
//   // Prepare the inline sprite
//   let svgSprite = document.getElementById('franklin-svg-sprite');
//   if (!svgSprite) {
//     const div = document.createElement('div');
//     div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" id="franklin-svg-sprite" style="display: none"></svg>';
//     svgSprite = div.firstElementChild;
//     document.body.append(div.firstElementChild);
//   }

//   // Download all new icons
//   const icons = [...element.querySelectorAll('span.icon')];
//   await Promise.all(icons.map(async (span) => {
//     const iconName = Array.from(span.classList).find((c) => c.startsWith('icon-')).substring(5);
//     if (!ICONS_CACHE[iconName]) {
//       ICONS_CACHE[iconName] = true;
//       try {
//         const response = await fetch(`${window.hlx.iconsPath}/${iconName}.svg`);
//         if (!response.ok) {
//           ICONS_CACHE[iconName] = false;
//           return;
//         }
//         // Styled icons don't play nice with the sprite approach because of shadow dom isolation
//         // and same for internal references
//         const svg = await response.text();
//         if (svg.match(/(<style | class=|url\(#| xlink:href="#)/)) {
//           ICONS_CACHE[iconName] = {
//             styled: true,
//             html: svg
//               // rescope ids and references to avoid clashes across icons;
//               .replaceAll(/ id="([^"]+)"/g, (_, id) => ` id="${iconName}-${id}"`)
//               .replaceAll(/="url\(#([^)]+)\)"/g, (_, id) => `="url(#${iconName}-${id})"`)
//               .replaceAll(/ xlink:href="#([^"]+)"/g, (_, id) => ` xlink:href="#${iconName}-${id}"`),
//           };
//         } else {
//           ICONS_CACHE[iconName] = {
//             html: svg
//               .replace('<svg', `<symbol id="icons-sprite-${iconName}"`)
//               .replace(/ width=".*?"/, '')
//               .replace(/ height=".*?"/, '')
//               .replace('</svg>', '</symbol>'),
//           };
//         }
//       } catch (error) {
//         ICONS_CACHE[iconName] = false;
//         // eslint-disable-next-line no-console
//         console.error(error);
//       }
//     }
//   }));

//   const symbols = Object
//     .keys(ICONS_CACHE).filter((k) => !svgSprite.querySelector(`#icons-sprite-${k}`))
//     .map((k) => ICONS_CACHE[k])
//     .filter((v) => !v.styled)
//     .map((v) => v.html)
//     .join('\n');
//   svgSprite.innerHTML += symbols;

//   icons.forEach((span) => {
//     const iconName = Array.from(span.classList).find((c) => c.startsWith('icon-')).substring(5);
//     const parent = span.firstElementChild?.tagName === 'A' ? span.firstElementChild : span;
//     // Styled icons need to be inlined as-is, while unstyled ones can leverage the sprite
//     if (ICONS_CACHE[iconName].styled) {
//       parent.innerHTML = ICONS_CACHE[iconName].html;
//     } else {
//       parent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"><use href="#icons-sprite-${iconName}"/></svg>`;
//     }
//   });
// }