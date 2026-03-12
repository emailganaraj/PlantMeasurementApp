// Environment-based config: try local first, fall back to production
let API_CONFIG = {
  BASE_URL: 'http://yuvasankalpa.in:8000', // Production (default)
  ENDPOINTS: {
    ANALYZE: '/analyze',
    HEALTH: '/health',
    CALIBRATION: '/calibration/current',
  },
};

// Try to load local config if available
try {
  const localConfig = require('./config.local');
  API_CONFIG = localConfig.API_CONFIG;
  console.log('Using local API config');
} catch (e) {
  console.log('Using production API config');
}

export { API_CONFIG };
