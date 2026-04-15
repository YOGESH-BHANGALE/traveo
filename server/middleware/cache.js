const { getCache, setCache } = require('../config/redis');

/**
 * Cache middleware for GET requests
 * @param {number} duration - Cache duration in seconds (default: 300 = 5 minutes)
 */
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and query params
    const key = `cache:${req.originalUrl || req.url}`;
    
    try {
      // Try to get cached data
      const cachedData = await getCache(key);

      if (cachedData) {
        console.log(`✓ Cache hit: ${key}`);
        return res.json(cachedData);
      }

      // Store original json function
      const originalJson = res.json.bind(res);

      // Override json function to cache the response
      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode === 200) {
          setCache(key, data, duration).catch(err => {
            console.error('Cache set error:', err);
          });
        }
        
        // Send response
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

module.exports = { cacheMiddleware };
