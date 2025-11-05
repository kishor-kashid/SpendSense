/**
 * Simple In-Memory Cache Utility
 * Provides caching for frequently accessed data to improve performance
 */

class Cache {
  constructor(defaultTTL = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (optional, uses default if not provided)
   */
  set(key, value, ttl = null) {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
    this.stats.sets++;
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.stats.evictions += this.cache.size;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is valid
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.evictions++;
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
      totalRequests: total
    };
  }

  /**
   * Clean expired entries (call periodically)
   * @returns {number} Number of entries cleaned
   */
  cleanExpired() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.stats.evictions++;
        cleaned++;
      }
    }
    
    return cleaned;
  }

  /**
   * Delete all cache entries matching a prefix
   * @param {string} prefix - Prefix to match (e.g., "recommendations:123")
   * @returns {number} Number of entries deleted
   */
  deleteByPrefix(prefix) {
    let deleted = 0;
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
      deleted++;
    });
    
    return deleted;
  }

  /**
   * Generate cache key from function name and arguments
   * @param {string} prefix - Prefix for the key (e.g., function name)
   * @param {...any} args - Arguments to include in key
   * @returns {string} Cache key
   */
  static generateKey(prefix, ...args) {
    const argsStr = args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg);
      }
      return String(arg);
    }).join(':');
    return `${prefix}:${argsStr}`;
  }
}

// Create singleton instance
const cache = new Cache();

// Attach static method to instance
cache.generateKey = Cache.generateKey;

// Clean expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanExpired();
  }, 300000); // 5 minutes
}

module.exports = cache;

