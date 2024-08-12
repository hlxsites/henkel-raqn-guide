import { getMeta, metaTags, readValue } from '../libs.js';

window.raqnComponentsMasterConfig = window.raqnComponentsMasterConfig || null;

// eslint-disable-next-line import/prefer-default-export
export const externalConfig = {
  defaultConfig(rawConfig = []) {
    return {
      attributesValues: {},
      nestedComponentsConfig: {},
      props: {},
      config: {},
      rawConfig,
      hasBreakpointsValues: false,
    };
  },

  async getConfig(componentName, configName = 'default') {
    if (!window.raqnComponentsMasterConfig) {
      window.raqnComponentsMasterConfig = await this.loadConfig();
    }
    const componentConfig = window.raqnComponentsMasterConfig?.[componentName];
    const parsedConfig = componentConfig?.[configName];
    if (parsedConfig) return parsedConfig;
    return {};
  },

  async loadConfig() {
    window.raqnComponentsConfig ??= (async () => {
      const { metaName, fallbackContent } = metaTags.componentsConfig;
      const metaConfigPath = getMeta(metaName) || 'components-config';
      const configPath = (!!metaConfigPath && `${metaConfigPath}.json`) || `${fallbackContent}.json`;
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
    window.raqnParsedConfigs = window.raqnParsedConfigs || {};
    if (window.raqnComponentsConfig) {
      Object.keys(window.raqnComponentsConfig).forEach((key) => {
        if (!window.raqnComponentsConfig[key]) return;
        const { data } = window.raqnComponentsConfig[key];
        if (data && data.length > 0) {
          window.raqnParsedConfigs[key] = window.raqnParsedConfigs[key] || {};
          window.raqnParsedConfigs[key] = readValue(data, window.raqnParsedConfigs[key]);
        }
      });
    }
    return window.raqnParsedConfigs;
  },
};
