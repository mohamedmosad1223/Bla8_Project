import api from './api';

export const dawahRequestService = {
  /**
   * Create a new dawah request (submitted by a Muslim Caller)
   */
  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/dawah-requests/', data);
    return response.data;
  },

  /**
   * Get my own submitted requests
   */
  getMySubmissions: async (skip = 0, limit = 50) => {
    const response = await api.get('/dawah-requests/my-submissions', {
      params: { skip, limit },
    });
    return response.data;
  },
};
