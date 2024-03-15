/* global WebImporter */

function transformLinks(main) {
  main.querySelectorAll('a').forEach((a) => {
    if (
      a.href.startsWith('/') ||
      a.href.startsWith(window.location.origin) ||
      a.href.startsWith('https://guide.raqn.io/')
    ) {
      const old = new URL(a.href);
      const hlx = new URL(
        `${old.pathname}${old.search}${old.hash}`,
        'https://main--henkel-raqn-guide--hlxsites.hlx.page/',
      );

      // Remove .html extension
      if (hlx.pathname.endsWith('.html')) {
        hlx.pathname = hlx.pathname.slice(0, -5);
      }

      a.href = hlx.toString();

      if (a.textContent === old.toString()) {
        a.textContent = a.href;
      }
    }
  });
}

function transformImages(document, main) {
  main
    .querySelectorAll(
      'meta[itemprop="contentUrl"][content^="https://dm.henkel-dam.com"]',
    )
    .forEach((meta) => {
      const newImg = document.createElement('img');
      newImg.src = `${meta.content}?wid=2560`;
      meta.replaceWith(newImg);
    });
}

function transformStages(document, main) {
  main.querySelectorAll('heliux-stage').forEach((stage) => {
    stage.replaceWith(
      WebImporter.DOMUtils.createTable(
        [['Hero'], [[...stage.children], [stage.querySelector('img')]]],
        document,
      ),
    );
  });
}

function transformTeaserLists(document, main) {
  main.querySelectorAll('heliux-teaserlist').forEach((teaserList) => {
    const cards = [...teaserList.querySelectorAll('li')].map((li) => [
      ...li.children,
    ]);
    teaserList.replaceWith(
      WebImporter.DOMUtils.createTable([['Card']].concat(cards), document),
    );
  });
}

export default {
  transformDOM: ({ document }) => {
    const main = document.querySelector('main');

    transformLinks(main);
    transformImages(document, main);
    transformStages(document, main);
    transformTeaserLists(document, main);

    return main;
  },
};
