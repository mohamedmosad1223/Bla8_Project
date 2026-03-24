import api from './api';

export const profileService = {
  /**
   * Update current user's profile info (name, email, phone)
   */
  updateProfile: async (data: { full_name?: string; email?: string; phone?: string }) => {
    // API uses Form Data for patch
    const formData = new FormData();
    if (data.full_name) formData.append('full_name', data.full_name);
    if (data.email) formData.append('email', data.email);
    if (data.phone) formData.append('phone', data.phone);

    const response = await api.patch('/profile/me', formData);
    return response.data;
  },

  /**
   * Change current user's password
   */
  changePassword: async (data: any) => {
    const response = await api.post('/profile/change-password', data);
    return response.data;
  },
  /**
   * Permanently delete current user's account
   */
  deleteAccount: async (password: string) => {
    const response = await api.post('/profile/delete-account', { password });
    return response.data;
  },
};
