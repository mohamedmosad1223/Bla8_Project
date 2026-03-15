import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Match FastAPI prefix
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // IMPORTANT: Backend uses HttpOnly cookies (access_token)
  // Mock adapter to disable backend calls temporarily
  adapter: (config) => {
    console.log('Mocking request to:', config.url);
    return new Promise((resolve) => {
      resolve({
        data: [], // Returning empty array as default mock data
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      });
    });
  }
});

// Add a response interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear user role if unauthorized
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

export default api;
