import api from './api';

export const preacherService = {
  /**
   * Register a new preacher
   * Requires multipart/form-data for file uploads
   */
  register: async (formData: FormData) => {
    const response = await api.post('/preachers/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get all preachers with optional filtering
   */
  getAll: async (skip: number = 0, limit: number = 50, filters?: Record<string, unknown>) => {
    const response = await api.get('/preachers/', {
      params: { skip, limit, ...filters },
    });
    return response.data;
  },

  /**
   * Get a specific preacher by ID
   */
  getById: async (preacherId: number | string) => {
    const response = await api.get(`/preachers/${preacherId}`);
    return response.data;
  },

  /**
   * Update a preacher's details
   */
  update: async (preacherId: number | string, data: Record<string, unknown>) => {
    const response = await api.patch(`/preachers/${preacherId}`, data);
    return response.data;
  },

  /**
   * Delete a preacher
   */
  delete: async (preacherId: number | string) => {
    const response = await api.delete(`/preachers/${preacherId}`);
    return response.data;
  },
};
