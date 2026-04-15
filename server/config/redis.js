const redis = require('redis');

let redisClient = null;

const connectRedis = async () => {
  // Only connect if REDIS_URL is provided
  if (process.env.REDIS_URL) {
    try {
      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        console.log('✓ Redis Connected');
      });

      await redisClient.connect();
    } catch (error) {
      console.error('Redis Connection Error:', error);
      console.log('ℹ Continuing without Redis caching');
    }
  } else {
    console.log('ℹ Redis URL not configured - caching disabled');
  }
};

const getCache = async (key) => {
  if (!redisClient || !redisClient.isOpen) return null;
  
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis Get Error:', error);
    return null;
  }
};

const setCache = async (key, value, expirySeconds = 3600) => {
  if (!redisClient || !redisClient.isOpen) return;
  
  try {
    await redisClient.setEx(key, expirySeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Redis Set Error:', error);
  }
};

const deleteCache = async (key) => {
  if (!redisClient || !redisClient.isOpen) return;
  
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis Delete Error:', error);
  }
};

const clearCachePattern = async (pattern) => {
  if (!redisClient || !redisClient.isOpen) return;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Redis Clear Pattern Error:', error);
  }
};

module.exports = { 
  connectRedis, 
  getCache, 
  setCache, 
  deleteCache,
  clearCachePattern 
};
