/**
 * Dependency Container - Simple dependency injection container
 * @version 4.0.0
 */
import { Logger } from '../utils/Logger.js';
import { EventBus } from '../utils/EventBus.js';
import { StorageService } from '../services/StorageService.js';
import { PlatformService } from '../services/PlatformService.js';
import { UsernameVariator } from '../services/UsernameVariator.js';
import { PlatformChecker } from '../services/PlatformChecker.js';
import { RiskScoreCalculator } from '../services/RiskScoreCalculator.js';
import { SearchEngine } from '../services/SearchEngine.js';
import { ImageAnalyzer } from '../services/ImageAnalyzer.js';
import { TorConnector } from '../services/TorConnector.js';
import { OSINTConnector } from '../services/OSINTConnector.js';

const logger = new Logger({ level: 'info' });

export class DependencyContainer {
  constructor() {
    this.services = new Map();
    this.initialized = false;
    logger.info('DependencyContainer created');
  }

  /**
   * Initialize the container with core services
   */
  async initialize() {
    if (this.initialized) {
      logger.warn('DependencyContainer already initialized');
      return;
    }

    // Create and register core services
    const eventBus = new EventBus();
    this.register('eventBus', eventBus);

    const storageService = new StorageService({
      cachePrefix: 'dahp_cache_',
      defaultTTL: 24 * 60 * 60 * 1000 // 24 hours
    });
    this.register('storageService', storageService);

    const platformService = new PlatformService(storageService);
    this.register('platformService', platformService);

    const usernameVariator = new UsernameVariator();
    this.register('usernameVariator', usernameVariator);

    const platformChecker = new PlatformChecker(storageService, eventBus);
    this.register('platformChecker', platformChecker);

    const riskScoreCalculator = new RiskScoreCalculator();
    this.register('riskScoreCalculator', riskScoreCalculator);

    const searchEngine = new SearchEngine(
      platformService,
      usernameVariator,
      platformChecker,
      riskScoreCalculator,
      storageService,
      eventBus
    );
    this.register('searchEngine', searchEngine);

    this.initialized = true;
    logger.info('DependencyContainer initialized with core services');
  }

  /**
   * Register a service in the container
   * @param {string} name - Service name
   * @param {any} instance - Service instance
   */
  register(name, instance) {
    this.services.set(name, instance);
    logger.debug(`Registered service: ${name}`);
  }

  /**
   * Get a service from the container
   * @param {string} name - Service name
   * @returns {any} Service instance
   */
  get(name) {
    if (!this.services.has(name)) {
      logger.error(`Service not found: ${name}`);
      throw new Error(`Service not found: ${name}`);
    }
    return this.services.get(name);
  }

  /**
   * Check if a service exists in the container
   * @param {string} name - Service name
   * @returns {boolean} True if service exists
   */
  has(name) {
    return this.services.has(name);
  }
}

// Create singleton instance
const container = new DependencyContainer();
export default container;
