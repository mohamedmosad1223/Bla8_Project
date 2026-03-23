import api from './api';

export interface DashboardStats {
  total_organizations: { title: string; value: number; is_positive?: boolean };
  total_preachers: { title: string; value: number; is_positive?: boolean };
  total_individuals: { title: string; value: number; is_positive?: boolean };
  total_cases: { title: string; value: number; is_positive?: boolean };
  total_converted: { title: string; value: number; is_positive?: boolean };
  total_rejected: { title: string; value: number; is_positive?: boolean };
  top_preachers: Array<{
    id: string | number;
    full_name: string;
    organization_name: string;
    success_rate: number;
  }>;
  organization_stats: Array<{
    id: string | number;
    organization_name: string;
    preachers_count: number;
  }>;
  nationalities_distribution: Array<{ label: string; value: number; color?: string }>;
  preacher_presence: {
    online: number;
    busy: number;
    offline: number;
  };
  recent_activities?: Array<{
    id: number;
    name: string;
    action: string;
    time: string;
  }>;
}

export const getAdminDashboardData = async (): Promise<DashboardStats> => {
  const response = await api.get<DashboardStats>('/dashboard/admin');
  return response.data;
};
