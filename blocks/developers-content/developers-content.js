import ComponentBase from '../../scripts/component-base.js';

const sitePathPrefix = '/developers';

export default class DeveloperToc extends ComponentBase {
  init() {
    super.init();
    this.generateTablesOfContent();
  }

  isIndex(segment) {
    return segment.toUpperCase() === 'README';
  }

  async loadPageHierarchy() {
    const response = await fetch('/query-index.json');
    if(!response.ok) return [];
    const json = await response.json();

    const pageHierarchy = { children:[] };
    // explode flat list into a hierarchy 
    json.data.filter(page => page.path.startsWith(sitePathPrefix)).forEach(page => {
      const segments = page.path.split('/').slice(2); // slice removes the first empty segement (because of leading /) and the /developers prefix
      const pageSegment = segments.pop(); // remove last segement which refers to the page itself
      let currentParent = pageHierarchy;
      const active = window.location.pathname === page.path;
      segments.forEach((segment) => {
        let node = currentParent.children.find((child) => child.segment === segment);
        if (!node) {
          node = {
            segment,
            label: segment,
            children: [],
          };
          currentParent.children.push(node);
        }
        node.active = node.active || active;
        currentParent = node;
      });
      currentParent.children.push({ 
        segment: pageSegment,
        label: this.isIndex(pageSegment) ? 'overview' : pageSegment, // rename README to Overview
        link: page.path,
        active,
      });
    });

    // shift repositories to the top level removing org and project levels
    const orgs = pageHierarchy.children;
    pageHierarchy.children = [];
    orgs.forEach((org) => org.children.forEach((project) => project.children.forEach((repository) => {
      repository.parents = [org.segment, project.segment];
      pageHierarchy.children.push(repository);
      // remove branch level if there is only one branch
      if(repository.children.length === 1) {
        repository.children = repository.children[0].children;
      } 
    })));
    
    // collapse all parents with only one child
    const collapse = (node) => {
      if(!node.children) return;
      if(node.children.length === 1) {
        const onlyChild = node.children[0];
        if(this.isIndex(onlyChild.segment)) {
          node.link = onlyChild.link;
        } else {
          node.parents = [...(node.parents || []), node.segment];
          Object.assign(node, onlyChild);
        }
        if(!onlyChild.children) {
          delete node.children;
        }
        collapse(node);
      } else {
        node.children.forEach((child) => collapse(child));
      }
    };
    pageHierarchy.children.forEach((repository) => repository.children.forEach((child) => collapse(child)));

    const sortChildren = (node) => {
      node.children?.sort((a, b) => {
        // readme should come first
        if(a.link && this.isIndex(a.segment)) return -1;
        if(b.link && this.isIndex(b.segment)) return 1;
        return a.segment.localeCompare(b.segment);
      });
      node.children?.forEach((child) => sortChildren(child));
    };
    sortChildren(pageHierarchy);
    
    return pageHierarchy;
  }
  
  generate(hierarchy, generator) {
    return hierarchy.children.map((child) => generator.call(this, child)).join('');
  }

  getLink(node) {
    if(node.link) {
      return node.link;
    }
    return this.getLink(node.children[0]);
  }
  
  generateStructure(node) {
    return `<li><a class="${node.link && node.active ? 'active' : ''}" href="${this.getLink(node)}">${node.label}
      ${node.parents ? `<span class="subline">${node.parents.join(' - ')}</span>` : ''}</a>
      ${node.children ? `<ul class="${node.active ? 'active' : ''}">${this.generate(node, this.generateStructure)}</ul>` : ''}
    </li>`;
  }

  async generateTablesOfContent() {
    const pageHierarchy = await this.loadPageHierarchy();
    this.innerHTML = `<ul>${this.generate(pageHierarchy, this.generateStructure)}</ul>`;
  }
}
