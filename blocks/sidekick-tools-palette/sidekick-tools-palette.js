import ComponentBase from '../../scripts/component-base.js';

function getPreviousElement(container) {
  const firstBlock = container.elements?.[0];
  const previousElement = firstBlock?.previousElementSibling;
  if (!previousElement) return null;
  if (previousElement.classList.contains('library-container-start')) {
    return previousElement.previousElementSibling;
  }
  return previousElement;
}

function getAuthorName(container) {
  const previousElement = getPreviousElement(container);
  if (!previousElement) return null;
  if (['H2', 'H3'].includes(previousElement.nodeName)) {
    return previousElement.textContent;
  }
  return null;
}

function getBlockName(block) {
  const classes = block.className.split(' ');
  const name = classes.shift();
  return classes.length > 0 ? `${name} (${classes.join(', ')})` : name;
}

function getContainerName(container) {
  const firstBlock = container.elements?.[0];
  return getAuthorName(container) || getBlockName(firstBlock);
}

const LIBRARY_METADATA = 'library-metadata';
const LIBRARY_CONTAINER_START = 'library-container-start';
const LIBRARY_CONTAINER_END = 'library-container-end';
// Block types:
const CONTAINER_START_BLOCK = 0;
const CONTAINER_END_BLOCK = 1;
const CONTAINER_INSIDE_BLOCK = 2;
const CONTAINER_OUTSIDE_BLOCK = 3;
const CONTAINER_OUTSIDE_AUTO_BLOCK = 4;

function getBlockType(subSection, withinContainer) {
  if (subSection.className === LIBRARY_CONTAINER_START) return CONTAINER_START_BLOCK;
  if (subSection.className === LIBRARY_CONTAINER_END) return CONTAINER_END_BLOCK;
  if (withinContainer) return CONTAINER_INSIDE_BLOCK;
  if (subSection.nodeName === 'DIV' && subSection.className) return CONTAINER_OUTSIDE_BLOCK;
  return CONTAINER_OUTSIDE_AUTO_BLOCK;
}

function getContainers(doc) {
  /* A page describing blocks is assumed to have the following representation
  (e.g. the page at /docs/library/blocks/carousel.plain.html):
  <body>
    <div>
      <p>Single block container</p>
      <h2>...</h2>
      <div class="block1">
      <div class="block2">
      <div class="library-metadata">
    </div>
    <div>
      <h2>...</h2>
      <p>Multiple block container</p>
      <div class="library-container-start"></div>
      <p>...</p>
      <div class="block3"></div>
    </div>
    ...
    <div>
      <h2>...</h2>
      <p>...</p>
      <div class="block4"></div>
      <div class="library-container-end"></div>
      <div class="library-metadata">
      ...
    </div>
    ...
  </body>

  The page html is parsed into sections (div children of body) and
  sub-sections (children of section).
  Parsing the above html results in the following container array:
  [{
      elements: [<div class="block1">],
    }, {
      elements: [<div class="block2">],
      library-metadata: <div class="library-metadata">
    }, {
      elements: [<p>, <div class="block3">, <p>---</p>, ...,<h2>, <p>, <div class="block4">],
      library-metadata: <div class="library-metadata">
    },
    ...
  ]
   */
  if (!doc || !doc.body) return [];
  const sections = doc.body.children;
  if (sections.length === 0) return [];
  const containers = [];
  const sectionBreak = doc.createElement('p');
  sectionBreak.textContent = '---';
  let container = { elements: [] };
  let withinContainer = false;
  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    const subSections = section.children;
    // eslint-disable-next-line no-continue
    if (subSections.length === 0) continue;
    for (let j = 0; j < subSections.length; j += 1) {
      const subSection = subSections[j];
      const nextSubSection = subSections[j + 1];
      const type = getBlockType(subSection, withinContainer);
      switch (type) {
        case CONTAINER_START_BLOCK:
          withinContainer = true;
          break;
        case CONTAINER_END_BLOCK:
          if (nextSubSection && nextSubSection.className === LIBRARY_METADATA) {
            container[LIBRARY_METADATA] = nextSubSection;
            j += 1;
          }
          containers.push(container);
          container = { elements: [] };
          withinContainer = false;
          break;
        case CONTAINER_INSIDE_BLOCK:
          container.elements.push(subSection);
          break;
        case CONTAINER_OUTSIDE_BLOCK:
          // single block container
          container.elements.push(subSection);
          if (nextSubSection && nextSubSection.className === LIBRARY_METADATA) {
            container[LIBRARY_METADATA] = nextSubSection;
            j += 1;
          }
          containers.push(container);
          container = { elements: [] };
          break;
        default:
          break;
      }
    }
    // when the container has multiple elements: add a section break after each section
    if (withinContainer) {
      container.elements.push(sectionBreak);
    }
  }
  return containers;
}

function handleLinks(element) {
  if (!element) return;
  try {
    element.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href');
      if (href.startsWith('/')) {
        a.setAttribute('href', `${window.location.origin}${href}`);
      }
    });
  } catch (e) {
    // leave links as is
  }
}

function decorateImages(element) {
  if (!element) return;
  try {
    element.querySelectorAll('img').forEach((img) => {
      const srcSplit = img.src.split('/');
      const mediaPath = srcSplit.pop();
      img.src = `${window.location.origin}/${mediaPath}`;
      const { width, height } = img;
      const ratio = width > 200 ? 200 / width : 1;
      img.width = width * ratio;
      img.height = height * ratio;
    });
  } catch (e) {
    // leave images as is
  }
}

function getTable(block) {
  const name = getBlockName(block);
  const rows = [...block.children];
  const maxCols = rows.reduce((cols, row) => (row.children.length > cols ? row.children.length : cols), 0);
  const table = document.createElement('table');
  table.setAttribute('border', 1);
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('th');
  headerCell.setAttribute('colspan', maxCols);
  headerCell.textContent = name;
  headerRow.append(headerCell);
  table.append(headerRow);
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    [...row.children].forEach((col) => {
      const td = document.createElement('td');
      if (row.children.length < maxCols) {
        td.setAttribute('colspan', maxCols);
      }
      td.innerHTML = col.innerHTML;
      tr.append(td);
    });
    table.append(tr);
  });
  return table.outerHTML;
}

function getHtml(container) {
  if (!container) return '';
  return container.elements.reduce((acc, element) => {
    decorateImages(element);
    handleLinks(element);

    if (element.className === 'mock-metadata') {
      element.className = 'metadata';
    }

    const isBlock = element.nodeName === 'DIV' && element.className;
    const content = isBlock ? getTable(element) : element.outerHTML;
    return `${acc}${content}`;
  }, '');
}

export default class SidekickToolsPalette extends ComponentBase {
  createEntry(name) {
    const subHeader = document.createElement('h3');
    subHeader.classList.add('hidden');
    subHeader.innerText = name;
    this.menuWrapper.before(subHeader);

    const menuItem = document.createElement('li');
    menuItem.innerText = name;
    this.menuRoot.append(menuItem);

    const subMenu = document.createElement('ul');
    subMenu.classList.add('submenu');
    subMenu.classList.add('hidden');
    this.menuRoot.after(subMenu);

    menuItem.addEventListener('click', () => {
      this.menuRoot.classList.add('hidden');
      subMenu.classList.remove('hidden');
      subHeader.classList.remove('hidden');
    });
    subHeader.addEventListener('click', () => {
      this.menuRoot.classList.remove('hidden');
      subMenu.classList.add('hidden');
      subHeader.classList.add('hidden');
    });

    return subMenu;
  }

  async initBlocks({ title, url }) {
    const subMenu = this.createEntry(title);

    const blocksResponse = await fetch(url);
    if (!blocksResponse.ok) return;
    const blocks = await blocksResponse.json();
    await Promise.all(
      blocks.data.map(async (block) => {
        const blockResponse = await fetch(`${block.path}.plain.html`);
        if (!blockResponse.ok) return;

        const html = await blockResponse.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const containers = getContainers(doc);
        if (!containers.length) return;
        const item = document.createElement('li');
        item.innerHTML = `<h4>${block.name}</h4><ul class="hidden"></ul>`;
        const itemHeader = item.querySelector('h4');
        const wrapper = item.querySelector('ul');
        itemHeader.addEventListener('click', () => {
          if (itemHeader.classList.contains('active')) {
            itemHeader.classList.remove('active');
            wrapper.classList.add('hidden');
          } else {
            subMenu.querySelectorAll('h4').forEach((h) => h.classList.remove('active'));
            subMenu.querySelectorAll('ul').forEach((ul) => ul.classList.add('hidden'));
            itemHeader.classList.add('active');
            wrapper.classList.remove('hidden');
          }
        });
        containers.forEach((container) => {
          const copyOption = document.createElement('li');
          copyOption.innerHTML = `<span>${getContainerName(container)}</span>`;
          wrapper.append(copyOption);
          copyOption.addEventListener('click', () => {
            const blob = new Blob([`<br>${getHtml(container)}<br>`], { type: 'text/html' });
            const data = [new ClipboardItem({ [blob.type]: blob })];
            navigator.clipboard.write(data);
            copyOption.classList.add('copied');
            setTimeout(() => copyOption.classList.remove('copied'), 1000);
          });
        });
        subMenu.append(item);
      }),
    );
  }

  async initPlaceholders({ title, url }) {
    const subMenu = this.createEntry(title);

    const placeholdersResponse = await fetch(url);
    if (!placeholdersResponse.ok) return;
    const placeholders = await placeholdersResponse.json();

    placeholders.data.forEach((placeholder) => {
      const item = document.createElement('li');
      item.innerHTML = `<div class="selectable"><p>${placeholder.text}</p><p class="details">(${placeholder.key})<p></div>`;
      subMenu.append(item);
      const selectable = item.querySelector('.selectable');
      selectable.addEventListener('click', () => {
        const blob = new Blob([`{{${placeholder.key}}}`], { type: 'text/plain' });
        const data = [new ClipboardItem({ [blob.type]: blob })];
        navigator.clipboard.write(data);
        selectable.classList.add('copied');
        setTimeout(() => selectable.classList.remove('copied'), 1000);
      });
    });
  }

  async initPalette() {
    const { searchParams } = new URL(window.location.href);
    this.innerHTML = 'loading ...';
    if (!searchParams.has('ref') || !searchParams.has('repo') || !searchParams.has('owner')) {
      this.innerHTML = 'loading ... failed.';
      return;
    }
    const configResponse = await fetch(
      `https://admin.hlx.page/sidekick/${searchParams.get('owner')}/${searchParams.get('repo')}/${searchParams.get(
        'ref',
      )}/config.json`,
    );
    if (!configResponse.ok) {
      this.innerHTML = 'loading ... failed.';
      return;
    }
    const config = await configResponse.json();

    this.innerHTML = `
<div class="menu-wrapper">
  <ul>
  </ul>
</div>`;

    this.menuWrapper = this.querySelector('.menu-wrapper');
    this.menuRoot = this.querySelector('ul');

    const thisPlugin = config.plugins.find(
      (plugin) =>
        plugin.url === window.location.pathname ||
        plugin.url === `${window.location.origin}${window.location.pathname}`,
    );
    if (!thisPlugin) {
      this.innerHTML = 'loading ... failed.';
      return;
    }
    config.plugins
      .filter((plugin) => plugin.containerId === thisPlugin.id)
      .forEach((plugin) => {
        switch (plugin.id) {
          case `${thisPlugin.id}-blocks`:
            this.initBlocks(plugin);
            break;
          case `${thisPlugin.id}-placeholders`:
            this.initPlaceholders(plugin);
            break;
          default:
            // eslint-disable-next-line no-console
            console.warn('failed to load plugin', plugin);
            break;
        }
      });
  }

  init() {
    super.init();
    this.initPalette();
  }
}
