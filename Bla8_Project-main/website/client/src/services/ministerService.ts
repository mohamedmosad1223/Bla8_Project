import api from './api';

export const ministerService = {
  /**
   * Get minister dashboard statistics
   */
  getDashboardStats: async () => {
    const response = await api.get('/minister/dashboard');
    return response.data;
  },

  /**
   * Get minister global preacher performance dashboard
   */
  getGlobalDashboardStats: async (orgId?: number, period: 'all_time' | 'this_month' | 'last_month' = 'all_time') => {
    const response = await api.get('/minister/global-dashboard', {
      params: { org_id: orgId, period }
    });
    return response.data;
  },

  /**
   * Get minister reports analytics dashboard
   */
  getReportsAnalytics: async (orgId?: number, period: 'all_time' | 'this_month' | 'last_month' = 'all_time') => {
    const response = await api.get('/minister/reports-analytics', {
      params: { org_id: orgId, period }
    });
    return response.data;
  },

  /**
   * Send analytics AI chat message
   */
  sendAnalyticsAIMessage: async (content: string) => {
    const response = await api.post('/chat/analytics/send', { content });
    return response.data;
  },

  /**
   * Get all organizations for minister
   */
  getOrganizations: async (search?: string) => {
    const response = await api.get('/minister/organizations', {
      params: { search }
    });
    return response.data;
  },

  /**
   * Get organization details by id for minister
   */
  getOrganizationDetails: async (orgId: number) => {
    const response = await api.get(`/minister/organizations/${orgId}`);
    return response.data;
  },

  /**
   * Get organization preachers for minister
   */
  getOrganizationPreachers: async (orgId: number, search?: string) => {
    const response = await api.get(`/minister/organizations/${orgId}/preachers`, {
      params: { search }
    });
    return response.data;
  },

  /**
   * Get all preachers for minister
   */
  getPreachers: async (filters?: any) => {
    const response = await api.get('/minister/preachers', {
      params: filters
    });
    return response.data;
  },

  /**
   * Get preacher details for minister
   */
  getPreacherDetails: async (preacherId: number, trendGranularity: 'daily' | 'monthly' = 'monthly') => {
    const response = await api.get(`/minister/preachers/${preacherId}`, {
      params: { trend_granularity: trendGranularity }
    });
    return response.data;
  }
};
