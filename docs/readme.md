# Edge Delivery

To introduce we're going to breafly talk about the current Edge Delivery Boilerplate / Out of the box (OOB) ways of doing and reasoning what we improve

## Advantages

- Simple document based authoring
- Fast server side delivery

## Simple Document based authoring

This simply resume into 2 things

1 - docs into HTML
2 - Excel / spreadsheets into JSON

### Docs into HTML

A simple doc file with a Example text will be rendered into something like

```
<!DOCTYPE html>
<html>
  <head>
    <title>Name of the document </title>
    <link rel="canonical" href="https://main--henkel-raqn-guide--hlxsites.hlx.page/untitled-document">
    <meta property="og:title" content="Name of the document">
    <meta property="og:url" content="https://main--henkel-raqn-guide--hlxsites.hlx.page/untitled-document">
    <meta property="og:image" content="https://main--henkel-raqn-guide--hlxsites.hlx.page/default-meta-image.png?width=1200&#x26;format=pjpg&#x26;optimize=medium">
    <meta property="og:image:secure_url" content="https://main--henkel-raqn-guide--hlxsites.hlx.page/default-meta-image.png?width=1200&#x26;format=pjpg&#x26;optimize=medium">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Name of the document">
    <meta name="twitter:image" content="https://main--henkel-raqn-guide--hlxsites.hlx.page/default-meta-image.png?width=1200&#x26;format=pjpg&#x26;optimize=medium">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="/scripts/lib-franklin.js" type="module"></script>
    <script src="/scripts/scripts.js" type="module"></script>
    <link rel="stylesheet" href="/styles/styles.css">
  </head>
  <body>
    <header></header>
    <main>
      <!--
        content of the document
       -->
    </main>
    <footer></footer>
  </body>
</html>
```

That way we have a clean simple way to generate HTML and JSON based on documents and document trees

With some OOB exceptions are also included like

Spreadsheets metadata that
metadata.xls

Requirements

- Clientside Hidratation dom transformation "decoration"
- Manual focus on FCP and LCP
- blocking resources before render

Boiler plate approach
1 - Performance
2 - Decoration by feature
3 - Manualy defining priority
4 - Eager and defered
5 - Semantical content used as component functional content (metadata)
