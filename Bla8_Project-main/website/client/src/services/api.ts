import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Vite proxy forwards this to http://127.0.0.1:5000/api
  withCredentials: true, // IMPORTANT: Backend uses HttpOnly cookies (access_token)
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
