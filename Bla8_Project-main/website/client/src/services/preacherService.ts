import api from './api';

// ─── Dashboard Types ──────────────────────────────────────────────────────────
export interface StatCard {
  title: string;
  value: number;
  change_percentage: number | null;
  is_positive: boolean;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface PreacherDashboardData {
  total_requests: StatCard;
  converted_count: StatCard;
  engagement_count: StatCard;
  rejected_count: StatCard;
  response_speed_chart: ChartDataPoint[];
  requests_by_status: ChartDataPoint[];
  follow_up_24h_rate: number;
  ai_suggestions_rate: number;
  governorates_distribution: ChartDataPoint[];
  countries_distribution: ChartDataPoint[];
  activity_chart: ChartDataPoint[];
}

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

  /**
   * Get the preacher's own dashboard stats & charts
   * Calls: GET /api/dashboard/preacher
   */
  getDashboard: async (): Promise<PreacherDashboardData> => {
    const response = await api.get('/dashboard/preacher');
    return response.data;
  },

  /**
   * Get all active languages in the system
   */
  getAllLanguages: async () => {
    const response = await api.get('/preachers/languages');
    return response.data;
  },

  /**
   * Get all countries in the system
   */
  getAllCountries: async () => {
    const response = await api.get('/preachers/countries');
    return response.data;
  },

  /**
   * Get all religions in the system
   */
  getAllReligions: async () => {
    const response = await api.get('/preachers/religions');
    return response.data;
  },
};

