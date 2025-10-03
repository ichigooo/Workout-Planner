// Environment configuration
const IS_DEVELOPMENT = __DEV__; // This is true when running in development mode

// Backend URLs, run ipconfig getifaddr en0 to get IP
const LOCAL_BACKEND_URL = 'http://192.168.86.27:3001/api';
// const LOCAL_BACKEND_URL = 'http://192.168.1.170:3001/api';
const CLOUD_BACKEND_URL = 'https://workoutplannerservice-mmdjdb8lh-nanas-projects-294a362f.vercel.app/api';

// Automatically choose backend based on environment
// Temporarily force cloud backend for user profile testing
export const API_BASE_URL = IS_DEVELOPMENT ? LOCAL_BACKEND_URL : CLOUD_BACKEND_URL;

// Export individual URLs for manual switching if needed
export const API_URLS = {
  LOCAL: LOCAL_BACKEND_URL,
  CLOUD: CLOUD_BACKEND_URL,
};
