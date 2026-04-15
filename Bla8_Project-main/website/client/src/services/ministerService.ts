import api from './api';

export const ministerService = {
  /**
   * Get minister dashboard statistics
   */
  getDashboardStats: async (trendGranularity: 'day' | 'month' = 'month') => {
    const response = await api.get('/minister/dashboard', {
      params: { trend_granularity: trendGranularity }
    });
    return response.data;
  },

  /**
   * Get minister global preacher performance dashboard
   */
  getGlobalDashboardStats: async (orgId?: number, period: 'all_time' | 'this_month' | 'last_month' = 'all_time', trendGranularity: 'day' | 'month' = 'month') => {
    const response = await api.get('/minister/global-dashboard', {
      params: { org_id: orgId, period, trend_granularity: trendGranularity }
    });
    return response.data;
  },

  /**
   * Get minister reports analytics dashboard
   */
  getReportsAnalytics: async (orgId?: number, period: 'all_time' | 'this_month' | 'last_month' = 'all_time', trendGranularity: 'day' | 'month' = 'month') => {
    const response = await api.get('/minister/reports-analytics', {
      params: { org_id: orgId, period, trend_granularity: trendGranularity }
    });
    return response.data;
  },

  /**
   * Send analytics AI chat message
   */
  getAnalyticsChatHistory: async () => {
    const response = await api.get('/chat/analytics/history');
    return response.data;
  },

  sendAnalyticsAIMessage: async (
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
  getOrganizationDetails: async (orgId: number, trendGranularity: 'day' | 'month' = 'month') => {
    const response = await api.get(`/minister/organizations/${orgId}`, {
      params: { trend_granularity: trendGranularity }
    });
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
