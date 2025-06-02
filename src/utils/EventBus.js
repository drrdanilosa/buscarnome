/**
 * EventBus - Centralized event management system
 * @version 4.0.0
 */
export class EventBus {
  constructor() {
    this.listeners = {};
    console.log('EventBus initialized');
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Function to remove the listener
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    console.debug(`Listener added for event: ${event}`);
    // Return function to remove listener
    return () => this.off(event, callback);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (!this.listeners[event]) return;

    this.listeners[event] = this.listeners[event]
      .filter(listener => listener !== callback);
    console.debug(`Listener removed for event: ${event}`);
  }

  /**
   * Emit an event to all registered listeners
   * @param {string} event - Event name
   * @param {*} data - Data to pass to listeners
   */
  emit(event, data) {
    if (!this.listeners[event]) return;

    console.debug(`Emitting event: ${event}`, data);
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}

