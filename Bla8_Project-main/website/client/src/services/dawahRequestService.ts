import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PoolRequest {
  request_id: number;
  request_type: string | null;
  status: string;
  communication_channel: string | null;
  deep_link: string | null;
  notes: string | null;
  submission_date: string;
  accepted_at: string | null;
  updated_at: string;

  // Invited person fields
  invited_first_name: string | null;
  invited_last_name: string | null;
  invited_gender: string | null;
  invited_nationality_id: number | null;
  invited_country_name: string | null;    // joined from countries table
  invited_language_id: number | null;
  invited_language_name: string | null;   // joined from languages table
  invited_religion: string | null;
  invited_phone: string | null;
  invited_email: string | null;

  // Submitter
  submitted_by_caller_id: number | null;
  submitted_by_person_id: number | null;
  submitted_by_name: string | null;
  preacher_name: string | null;
  invited_name: string | null;
  needs_report?: boolean;
}

export interface PoolFilters {
  gender?: string;         // 'male' | 'female'
  language_id?: number;
  date_from?: string;      // ISO date string
  date_to?: string;
  sort?: 'newest' | 'oldest';
}

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

  /**
   * Get the public pool of pending dawah requests (Preacher view)
   * GET /api/dawah-requests/pool
   */
  getPool: async (skip = 0, limit = 100): Promise<{ message: string; data: PoolRequest[] }> => {
    const response = await api.get('/dawah-requests/pool', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Get my accepted requests (For Preacher: Current requests)
   */
  getMyRequests: async (skip = 0, limit = 100): Promise<{ message: string; data: PoolRequest[] }> => {
    const response = await api.get('/dawah-requests/my', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Accept a dawah request (Preacher only)
   * POST /api/dawah-requests/{request_id}/accept
   */
  acceptRequest: async (requestId: number) => {
    const response = await api.post(`/dawah-requests/${requestId}/accept`);
    return response.data;
  },

  /**
   * Get a single request details
   * GET /api/dawah-requests/{request_id}
   */
  getById: async (requestId: number) => {
    const response = await api.get(`/dawah-requests/${requestId}`);
    return response.data;
  },

  /**
   * Update request status
   * PATCH /api/dawah-requests/{request_id}/status
   */
  updateStatus: async (requestId: number, data: { new_status: string; preacher_feedback?: string; conversion_date?: string }) => {
    const response = await api.patch(`/dawah-requests/${requestId}/status`, data);
    return response.data;
  },

  /**
   * Get all requests belonging to an organization (Org Manager view)
   */
  getOrganizationRequests: async (skip = 0, limit = 100): Promise<{ message: string; data: PoolRequest[] }> => {
    const response = await api.get('/dawah-requests/my', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Get all reports for a specific request
   * GET /api/dawah-reports/{request_id}
   */
  getReports: async (requestId: number): Promise<{ data: any[] }> => {
    const response = await api.get(`/dawah-reports/${requestId}`);
    return response.data;
  },

  /**
   * Submit a daily dawah report
   * POST /api/dawah-reports/
   */
  submitReport: async (data: { request_id: number; communication_type: string; communication_details?: string; content: string }) => {
    const response = await api.post('/dawah-reports/', data);
    return response.data;
  },
};
