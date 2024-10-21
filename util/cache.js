/**
 * Redis cache to store ticket information, verify tickets, and manage blacklists.
 */
import {  createClient } from 'redis';

class RedisCache {
  constructor() {
    this.client = createClient();

    // Connect to Redis and handle connection errors
    this.client.connect()
      .then(() => {
        console.log('Redis Server started');
      })
      .catch((error) => {
        console.error(`Error starting Redis server: ${error}`);
      });
  }

  /**
   * Check if the Redis client is active.
   * @returns {Promise<boolean>} - True if Redis client is working, false otherwise.
   */
  async isLive() {
    try {
      return this.client.ping(); // Return true if Redis is live
    } catch (error) {
      console.error(`Error checking Redis server status: ${error}`);
      return false; // Return false on error
    }
  }

  /**
   * Retrieve a value from Redis using the given key.
   * @param {string} key - The key of the value to retrieve.
   * @returns {Promise<boolean>} - The retrieved value or null if not found.
   */
  async get(key) {
    try {
      return this.client.get(key); // Returns the value or null if not found
    } catch (error) {
      console.error(`Error retrieving value from Redis: ${error}`);
      throw error; // Rethrow the error for further handling
    }
  }

  /**
   * Set a key-value pair in Redis.
   * @param {string} key - The key of the value to store in Redis.
   * @param {string|number} value - The value to store in Redis.
   * @param {object} [options] - Optional settings (like TTL).
   * @param {number} [options.ttl] - Time-to-live in seconds for the key.
   * @returns {Promise<void>}
   */
  async set(key, value, options = {}) {
    try {
      if (options.ttl) {
        this.client.set(key, value, 'EX', options.ttl); // Set with TTL if provided
      } else {
        this.client.set(key, value);
      }
    } catch (error) {
      console.error(`Error setting value in Redis: ${error}`);
      throw error; // Rethrow the error for further handling
    }
  }

  /**
   * Retrieve a hashset from Redis using a given key.
   * @param {string} key - The key of the hashset to retrieve.
   * @returns {Promise<Object>} - An object representing the hashset values.
   */
  async hGetAll(key) {
    try {
      return this.client.HGETALL(key);
    } catch (error) {
      console.error(`Error retrieving hashset in Redis: ${error}`);
      throw error; // Rethrow the error for further handling
    }
  }

  /**
   * Set multiple fields in a hashset in Redis.
   * @param {string} key - The key of the hashset to set values for.
   * @param {Object} value - An object containing key-value pairs to set in the hashset.
   * @returns {Promise<void>}
   */
  async hSet(key, value) {
    try {
      await this.client.hSet(key, value); // Set multiple fields in a hashset
    } catch (error) {
      console.error(`Error setting values in hashset in Redis: ${error}`);
      throw error; // Rethrow the error for further handling
    }
  }

  /**
   * Deletes a key-value pair from redis
   * @param key {string} - The key of the value to delete
   * @return {Promise<void>}
   */
  async del(key) {
    this.client.del(key);
  }
}

const cache = new RedisCache();
export default cache;
