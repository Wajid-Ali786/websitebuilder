/**
 * HOOKS SYSTEM
 * WordPress-style Event functionality.
 * Allows plugins to 'hook' into core logic without modifying it.
 */

export const Hooks = {
  actions: {},
  filters: {},

  /**
   * Add a callback to an action hook
   * @param {string} hookName
   * @param {function} callback
   * @param {number} priority
   */
  addAction(hookName, callback, priority = 10) {
    if (!this.actions[hookName]) {
      this.actions[hookName] = [];
    }
    this.actions[hookName].push({ callback, priority });
    this.actions[hookName].sort((a, b) => a.priority - b.priority);
  },

  /**
   * Trigger an action
   * @param {string} hookName
   * @param  {...any} args
   */
  doAction(hookName, ...args) {
    if (this.actions[hookName]) {
      this.actions[hookName].forEach((action) => {
        try {
          action.callback(...args);
        } catch (e) {
          console.error(`Error in action [${hookName}]:`, e);
        }
      });
    }
  },

  /**
   * Add a filter to modify data
   * @param {string} hookName
   * @param {function} callback
   * @param {number} priority
   */
  addFilter(hookName, callback, priority = 10) {
    if (!this.filters[hookName]) {
      this.filters[hookName] = [];
    }
    this.filters[hookName].push({ callback, priority });
    this.filters[hookName].sort((a, b) => a.priority - b.priority);
  },

  /**
   * Apply filters to a value
   * @param {string} hookName
   * @param {any} value
   * @param  {...any} args
   * @returns {any} Modified value
   */
  applyFilters(hookName, value, ...args) {
    if (this.filters[hookName]) {
      return this.filters[hookName].reduce((currentValue, filter) => {
        try {
          return filter.callback(currentValue, ...args);
        } catch (e) {
          console.error(`Error in filter [${hookName}]:`, e);
          return currentValue;
        }
      }, value);
    }
    return value;
  },
};
