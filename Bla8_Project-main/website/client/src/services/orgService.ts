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
   * Update an organization's details using FormData for file uploads
   */
  updateFormData: async (orgId: number | string, formData: FormData) => {
    const response = await api.patch(`/organizations/${orgId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
  getAnalyticsChatHistory: async () => {
    const response = await api.get('/chat/analytics/history');
    return response.data;
  },

  sendAssociationAIMessage: async (
    content: string,
    period?: 'all_time' | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year',
    conversationId?: number | null
  ) => {
    const payload: { content: string; period?: string; conversation_id?: number } = { content };
    if (period && period !== 'all_time') payload.period = period;
    if (conversationId) payload.conversation_id = conversationId;
    const response = await api.post('/chat/analytics/send', payload);
    return response.data;
  },

  /**
   * Report Scheduling APIs
   */
  getReportSchedules: async () => {
    const response = await api.get('/report-schedules/');
    return response.data;
  },

  addReportSchedule: async (data: { name: string; timing: string; report_type: string }) => {
    const response = await api.post('/report-schedules/', data);
    return response.data;
  },

  deleteReportSchedule: async (id: number) => {
    const response = await api.delete(`/report-schedules/${id}`);
    return response.data;
  },
};
