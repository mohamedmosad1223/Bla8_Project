import api from './api';

export const authService = {
  /**
   * Login using OAuth2 form data
   * Backend uses form data (username, password) and sets an HttpOnly cookie.
   */
  login: async (email: string, password: string, role?: string | null) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      let url = '/auth/login';
      if (role) {
        url += `?role=${role}`;
      }

      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Logout by clearing the HttpOnly cookie and calling backend API
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* silent */ }
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    window.dispatchEvent(new Event('auth-change')); // Tell header to update
  },

  /**
   * Fetch current user profile from backend API.
   */
  getMe: async () => {
    try {
      const response = await api.get('/profile/me');
      if (response.data) {
        localStorage.setItem('userData', JSON.stringify(response.data));
        // Sync userRole as well to prevent desync bugs
        if (response.data.user?.role) {
          localStorage.setItem('userRole', response.data.user.role);
        }
        window.dispatchEvent(new Event('auth-change'));
      }
      return response.data;
    } catch (error) {
      console.error('Get me error:', error);
      throw error;
    }
  },

  /**
   * Request password reset OTP
   */
  forgotPassword: async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  /**
   * Verify OTP code
   */
  verifyOtp: async (email: string, otp: string) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  },

  /**
   * Reset password with OTP
   */
  resetPassword: async (data: any) => {
    try {
      const response = await api.post('/auth/reset-password', data);
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },
};
