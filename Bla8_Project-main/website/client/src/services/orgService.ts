import api from './api';

export const orgService = {
  /**
   * Register a new organization
   * Requires multipart/form-data for file uploads
   */
  register: async (formData: FormData) => {
    const response = await api.post('/organizations/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get all organizations with optional filtering
   */
  getAll: async (skip: number = 0, limit: number = 50, filters?: Record<string, unknown>) => {
    const response = await api.get('/organizations/', {
      params: { skip, limit, ...filters },
    });
    return response.data;
  },

  /**
   * Get a specific organization by ID
   */
  getById: async (orgId: number | string) => {
    const response = await api.get(`/organizations/${orgId}`);
    return response.data;
  },

  /**
   * Update an organization's details
   */
  update: async (orgId: number | string, data: Record<string, unknown>) => {
    const response = await api.patch(`/organizations/${orgId}`, data);
    return response.data;
  },

  /**
   * Delete an organization
   */
  delete: async (orgId: number | string) => {
    const response = await api.delete(`/organizations/${orgId}`);
    return response.data;
  },

  /**
   * Get organization dashboard statistics
   * Returns 8 stat cards + 3 charts data
   */
  getDashboardStats: async (trendGranularity: 'day' | 'month' = 'month') => {
    const response = await api.get('/dashboard/organization', {
      params: { trend_granularity: trendGranularity }
    });
    return response.data;
  },

  /**
   * Send association AI chat message (reuses the analytics endpoint which supports organization role)
   */
  sendAssociationAIMessage: async (content: string) => {
    const response = await api.post('/chat/analytics/send', { content });
    return response.data;
  },
};
