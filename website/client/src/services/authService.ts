import api from './api';

export const authService = {
  /**
   * Login using OAuth2 form data
   * Backend uses form data (username, password) and sets an HttpOnly cookie.
   */
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  /**
   * Logout by clearing the HttpOnly cookie
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Get current logged-in user profile
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
