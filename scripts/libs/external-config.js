import { getMeta, metaTags, readValue, deepMerge, getBaseUrl } from '../libs.js';

window.raqnComponentsMasterConfig = window.raqnComponentsMasterConfig || null;

// eslint-disable-next-line import/prefer-default-export
export const externalConfig = {
  async getConfig(componentName, configName = 'default') {
    window.raqnComponentsMasterConfig ??= await this.loadConfig();
    const componentConfig = window.raqnComponentsMasterConfig?.[componentName];
    const parsedConfig = componentConfig?.[configName];

    // return copy of object to prevent mutation of raqnComponentsMasterConfig;
    if (parsedConfig) return deepMerge({}, parsedConfig);
    return {};
  },

  async loadConfig() {
    window.raqnComponentsConfig ??= (async () => {
      const { metaName } = metaTags.themeConfigComponent;
      const metaConfigPath = getMeta(metaName);
      const basepath = getBaseUrl();
      const configPath = `${basepath}${metaConfigPath}.json`;
      let result = null;
      try {
        const response = await fetch(`${configPath}`);
        if (response.ok) {
          result = await response.json();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
      return result;
    })();

    window.raqnComponentsConfig = await window.raqnComponentsConfig;

    return this.simplifiedConfig();
  },

  simplifiedConfig() {
    if (window.raqnComponentsConfig && !window.raqnParsedConfigs) {
      window.raqnParsedConfigs ??= {};

      Object.keys(window.raqnComponentsConfig).forEach((key) => {
        if (!window.raqnComponentsConfig[key]) return;
        const { data } = window.raqnComponentsConfig[key];
        if (data?.length) {
          window.raqnParsedConfigs[key] = window.raqnParsedConfigs[key] || {};
          window.raqnParsedConfigs[key] = readValue(data, window.raqnParsedConfigs[key]);
        }
      });
    }

    return window.raqnParsedConfigs;
  },
};
