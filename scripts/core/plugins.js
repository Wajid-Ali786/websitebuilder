/**
 * PLUGIN MANAGER
 * Handles loading and initializing external plugins.
 */
import { Hooks } from "./hooks.js";
import { WidgetRegistry } from "./widgets.js";

export const PluginManager = {
  activePlugins: [],

  /**
   * Initialize Plugin System
   * @param {object} builderAPI - Safe API exposed to plugins
   */
  async init(builderAPI) {
    // In a real app, fetch this list from LocalStorage or config
    // For demo, we try to load a sample plugin if it exists
    const pluginsToLoad = ["./plugins/sample-widget/plugin.js"];

    console.log("Initializing Plugins...");

    const promises = pluginsToLoad.map((url) =>
      this.loadPlugin(url, builderAPI),
    );
    await Promise.all(promises);

    Hooks.doAction("plugins_loaded");
  },

  /**
   * Load a single plugin
   */
  async loadPlugin(url, builderAPI) {
    try {
      // Dynamic import
      const module = await import(url);

      if (module.default && typeof module.default.init === "function") {
        const plugin = module.default;
        console.log(`Loading plugin: ${plugin.name} v${plugin.version}`);

        // Initialize plugin with API
        plugin.init(builderAPI);

        this.activePlugins.push(plugin);
      } else {
        console.warn(`Invalid plugin format: ${url}`);
      }
    } catch (e) {
      console.warn(`Failed to load plugin: ${url}`, e);
    }
  },
};
