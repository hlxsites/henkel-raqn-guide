import ComponentBase from '../../scripts/component-base.js';

const sitePathPrefix = 'developers';

export default class DeveloperToc extends ComponentBase {
  ready() {
    this.generateTablesOfContent();
  }

  isIndex(node) {
    return node.page && node.segment === 'README';
  }

  toLink(path) {
    if(window.location.host.startsWith('localhost') || window.location.host.search(/\.aem\.(page|live)/) > 0) {
      return path;
    }
    return `/${sitePathPrefix}${path}`;
  }

  async loadPageHierarchy() {
    const response = await fetch(`/${sitePathPrefix}/query-index.json`);
    if(!response.ok) return [];
    const json = await response.json();

    const pageHierarchy = [];
    const pageHierarchyObject = { children:pageHierarchy };
    let currentNode;
    json.data.forEach(page => {
      const segments = page.path.split('/').slice(1);
      let currentParent = pageHierarchyObject;
      let nodePath = '';
      segments.forEach((segment) => {
        nodePath += `/${segment}`;
        let node = currentParent.children.find((child) => child.segment === segment);
        if (!node) {
          node = {
            nodePath,
            segment,
            active: window.location.pathname.startsWith(nodePath),
            children: [],
          };
          if(nodePath === page.path) {
            node.page = page;
            if(this.isIndex(node)) {
              currentParent.link = page.path;
            }
            if(!currentNode && node.active) {
              currentNode = node;
            }
          }
          currentParent.children.push(node);
        }
        currentParent = node;
      });
    });

    const postProcessHierarchy = (node) => {
      node.children.sort((a, b) => a.segment.localeCompare(b.segment));
      if(!node.page && !node.link) {
        const firstChildPage = node.children.find((child) => child.page);
        if(firstChildPage) {
          node.link = firstChildPage.path;
        }
      }
      node.children.forEach((child) => postProcessHierarchy(child));
    };
    postProcessHierarchy(pageHierarchyObject);

    return [pageHierarchy, currentNode];
  }

  generateRepository(repository) {
    const a = document.createElement('a');
    a.href = this.toLink(repository.link);
    a.innerText = repository.segment;
    return `<li class=${repository.active ? 'active' : ''}><h3>${a.outerHTML}</h3>`;
  }

  generateProjects(org) {
    return org.children.map((project) => {
      const h2 = document.createElement('h2');
      h2.innerText = `${org.segment} - ${project.segment}`;
      return `<li class=${project.active ? 'active' : ''}>${h2.outerHTML}
        <ul>${ project.children.map((repository) => this.generateRepository(repository)).join('')}</ul></li>`;
    }).join('');
  }

  generatePages(node) {
    if(this.isIndex(node)) return '';

    const link = node.link || node.page?.path;
    const li = document.createElement('li');
    if(link) {
      const a = document.createElement('a');
      a.href = this.toLink(link);
      a.innerText = node.segment;
      li.innerHTML = a.outerHTML;
    } else {
      li.innerText = node.segment;
    }

    const childrenHTML = node.children.map((child) => this.generatePages(child)).join('');
    if(childrenHTML) {
      const ul = document.createElement('ul');
      ul.innerHTML = childrenHTML;
      li.appendChild(ul);
    }
    
    return li.outerHTML;
  }

  async generateTablesOfContent() {
    const [pageHierarchy, currentNode] = await this.loadPageHierarchy();
    const currentOrg = pageHierarchy.find((org) => org.active);
    const currentProject = currentOrg?.children.find((project) => project.active);
    const currentRepository = currentProject?.children.find((repository) => repository.active);

    let tocs = `<ul class="main">${pageHierarchy.map((project) => this.generateProjects(project)).join('')}</ul>`;

    if(currentRepository && currentNode) {
      const h2 = document.createElement('h2');
      h2.innerText = `${currentOrg.segment} - ${currentProject.segment} - ${currentRepository.segment}`;
      tocs += `<hr><div class="active">${h2.outerHTML}
        <ul>${currentRepository.children.map((child) => this.generatePages(child)).join('')}</ul></div>`;
    }

    this.innerHTML = tocs;
  }
}
