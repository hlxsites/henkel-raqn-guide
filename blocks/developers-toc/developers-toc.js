import ComponentBase from '../../scripts/component-base.js';

const sitePathPrefix = 'developers';
const henkelOrg = 'henkeldx';

export default class DeveloperToc extends ComponentBase {
  ready() {
    this.setupToc();
  }

  async setupToc() {
    const response = await fetch(`/${sitePathPrefix}/query-index.json`);
    if(!response.ok) return;
    const json = await response.json();
    const repositories = json.data.reduce((map, page) => {
      const [, , project, repository] = page.path.split('/');
      if(!map[project]) map[project] = new Set();
      map[project].add(repository);
      return map;
    }, {});
    const generatePages = (project, repository) => {
      const pages = json.data.filter((page) => page.path.startsWith(`/${henkelOrg}/${project}/${repository}`));
      return pages.map((page) => `<li><a href="//${sitePathPrefix}${page.path}">${page.title}</a></li>`);
    };
    const generateRepository = (project, repository) => `<li><h3>${repository}</h3>
      <ul>${generatePages(project, repository)}</ul></li>`;
    const generateProject = (project) => `<li><h2>${project}</h2>
      <ul>${[...repositories[project]].map((repository) => generateRepository(project, repository))}</ul></li>`;
    const orgs = `<ul>${Object.keys(repositories).map(generateProject)}</ul>`;
    this.innerHTML = orgs;
  }
}
