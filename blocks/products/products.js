import ComponentBase from '../../scripts/component-base.js';

localStorage.setItem('personalisationContext', JSON.stringify({history:{'latest':{service:'IoT services'}},user:{industry:'Medical'}}));

const query = `query RaqnwebSearchAllFiltersQuery($term: String, $site: RaqnwebSite!, $tab: String, $size: Int) {
  raqnwebSearch(term: $term, site: $site, tab: $tab, size: $size) {
    resultCount
    results {
      __typename
      ... on RaqnwebPageSearchResult {
        title
        preTitle
        description
        url
        snippet
        image
        imageAlt
        date
        pageType
      }
      ... on ProductSearchResult {
        ...productSearchResult
      }
    }
  }
}

fragment productFields on ProductFields {
  productSku
  productCatalog
  productLanguage
  productName
  productNameExtension
  productDescription
  productShortDescription
  productLongProductName
  productHistoricalName
  sortedProductCategories
  productKnownAs
  productTagline
  variants {
    ...variantFields
  }
  productCategories {
    ...productCategories
  }
  productExtraFields
  productPackaging {
    ...packagingInfo
  }
  productExtraLocalFields
}

fragment productCategories on ProductCategory {
  code
  parentCode
}

fragment variantFields on VariantFields {
  variantIdh
  variantExtraFields
  variantUrl
}

fragment productSearchResult on ProductSearchResult {
  title
  preTitle
  description
  url
  snippet
  image
  imageAlt
  date
  productMainImage
  productMainImageAltText
  variantSizes
  productFields {
    ...productFields
  }
  price {
    idh
    minPrice
    currency
    stockStatus
    maxOrderQty
    saleableQty
  }
  available
  productCommerceSort
  commerceProductFields
}

fragment packagingInfo on ProductPackaging {
  gtin
  productName
  minimumOrderQuantity
  multipleOrderQuantity
}`;

const variables = (term) => ({
  size: 5,
  site: {
    tenant: 'adhesive/pro-now',
    country: 'us',
    language: 'en',
    tabConfigs: [
      {
        name: 'Products',
        types: [
          {
            type: 'PAGE_TYPE',
            values: [
              'product',
            ],
          },
        ],
      },
    ],
  },
  tab: 'Products',
  term,
});

const payload = (term) => ({
  operationName: 'RaqnwebSearchAllFiltersQuery',
  variables: variables(term),
  query,
});

export default class Products extends ComponentBase {

  loadConfig() {
    this.config = [...this.querySelectorAll('raqn-products div > div:first-child')].reduce((m, keyElement) => {
      m[keyElement.innerText] = keyElement.nextElementSibling;
      return m;
    }, {});
  }

  loadSearchTerm() {
    const context = JSON.parse(localStorage.getItem('personalisationContext') || '{}');
    if (!context) {
      return false;
    }
    // eslint-disable-next-line no-restricted-syntax
    for(const li of this.config.searchTerm?.querySelectorAll('li') || []) {
        let result = li.innerText;
        // eslint-disable-next-line no-restricted-syntax
        for(const match of [...li.innerText.matchAll(/%([^%]+)%/g) || []]) {
          const key = match[1];
          const value = key.split('.').reduce((c, k) => c[k], context);
          if (!value) {
            result = false;
            break;
          }
          result = `${result.substring(0, match.index)}${value}${result.substring(match.index + key.length + 2)}`;
        }
        if (result) {
          return result;
        }
    }
    return false;
  }

  async fetchProducts() {
    const response = await fetch('https://s-weu-uat-raqnsp-apim.azure-api.net/raqnsearch/raqnsearch', {
      headers: {
        'content-type': 'application/json',
        'subscription-key': 'ce8f21f593684a5fb0b4cad4725b3d56',
      },
      body: JSON.stringify(payload(this.loadSearchTerm() || this.config.fallback?.innerText || '')),
      method: 'POST',
    });

    const data = await response.json();

    return data.data.raqnwebSearch.results;
  }

  async connected() {
    this.loadConfig();
    this.products = await this.fetchProducts();
    this.innerHTML = `<h3>Personalised Products</h3><ul>
      ${this.products.map((product) => `<li>${product.productFields.productSku} - ${product.title}</li>`).join('')}
    </ul>`;
  }

}
