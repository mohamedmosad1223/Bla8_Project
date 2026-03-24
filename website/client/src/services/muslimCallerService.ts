import api from './api';

export const muslimCallerService = {
  /**
   * Register a new Muslim Caller
   * Can involve a multipart form if certificates are uploaded
   */
  register: async (data: any) => {
    const response = await api.post('/muslim-callers/register', data);
    return response.data;
  },

  getAll: async (skip: number = 0, limit: number = 50, filters?: Record<string, unknown>) => {
    const response = await api.get('/muslim-callers/', {
      params: { skip, limit, ...filters },
    });
    return response.data;
  },

  getById: async (callerId: number | string) => {
    const response = await api.get(`/muslim-callers/${callerId}`);
    return response.data;
  },

  update: async (callerId: number | string, data: Record<string, unknown>) => {
    const response = await api.patch(`/muslim-callers/${callerId}`, data);
    return response.data;
  },

  delete: async (callerId: number | string) => {
    const response = await api.delete(`/muslim-callers/${callerId}`);
    return response.data;
  },
};
