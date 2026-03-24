import api from './api';

export const interestedPersonService = {
  /**
   * Register a new Interested Person
   * It is a JSON payload, not multipart
   */
  register: async (data: Record<string, unknown>) => {
    const response = await api.post('/interested-persons/register', data);
    return response.data;
  },

  getAll: async (skip: number = 0, limit: number = 50, filters?: Record<string, unknown>) => {
    const response = await api.get('/interested-persons/', {
      params: { skip, limit, ...filters },
    });
    return response.data;
  },

  getById: async (personId: number | string) => {
    const response = await api.get(`/interested-persons/${personId}`);
    return response.data;
  },

  update: async (personId: number | string, data: Record<string, unknown>) => {
    const response = await api.patch(`/interested-persons/${personId}`, data);
    return response.data;
  },

  delete: async (personId: number | string) => {
    const response = await api.delete(`/interested-persons/${personId}`);
    return response.data;
  },
};
