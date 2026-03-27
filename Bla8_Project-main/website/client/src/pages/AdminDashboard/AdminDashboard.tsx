import { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import StatCard from '../../components/StatCard/StatCard';
import {
  Users,
  FileText,
  UserCheck,
  UserX,
  Loader2,
  AlertTriangle,
  Building,
  MessageSquare,
  BookOpen,
  Send
} from 'lucide-react';
import api from '../../services/api';
import WorldMap from '../../components/WorldMap/WorldMap';
import './AdminDashboard.css';

interface DashboardData {
  total_organizations: { title: string; value: number; is_positive: boolean };
  pending_org_requests: { title: string; value: number; is_positive: boolean };
  total_conversations: { title: string; value: number; is_positive: boolean };
  total_follow_up: { title: string; value: number; is_positive: boolean };
  total_converted: { title: string; value: number; is_positive: boolean };
  total_rejected: { title: string; value: number; is_positive: boolean };
  total_cases: { title: string; value: number; is_positive: boolean };
  total_individuals: { title: string; value: number; is_positive: boolean };
  top_preachers: Array<{
    preacher_id: number;
    full_name: string;
    organization_name: string;
    success_rate: number;
  }>;
  organization_stats: Array<{
    org_id: number;
    organization_name: string;
    preachers_count: number;
  }>;
  nationalities_distribution: Array<{ label: string; value: number }>;
  preacher_presence: { online: number; busy: number; offline: number };
  recent_activities: Array<{
    id: number;
    name: string;
    action: string;
    time: string;
    timestamp: string;
  }>;
}

const AdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/admin');
        setData(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('تعذر تحميل بيانات لوحة التحكم. يرجى المحاولة مرة أخرى لاحقاً.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="ad-loading-state">
        <Loader2 className="animate-spin" size={48} color="#DBA841" />
        <p>جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="ad-error-state">
        <AlertTriangle size={48} color="#EF4444" />
        <p>{error || 'حدث خطأ غير متوقع'}</p>
        <button onClick={() => window.location.reload()} className="ad-retry-btn">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // ─── Stat Cards Mapping ───────────────────────────────────────
  const statCards = [
    { title: 'إجمالي عدد الجمعيات', value: data.total_organizations.value, icon: <Building size={24} />, bgColor: '#E0E7FF', color: '#6366F1', trend: 'up' as const, trendValue: 'جديد' },
    { title: 'إجمالي عدد طلبات الجمعية', value: data.pending_org_requests.value, icon: <FileText size={24} />, bgColor: '#FEF3C7', color: '#D97706', trend: 'up' as const, trendValue: 'بانتظار المراجعة' },
    { title: 'إجمالي عدد المحادثات', value: data.total_conversations.value, icon: <MessageSquare size={24} />, bgColor: '#E0F2FE', color: '#0EA5E9', trend: 'up' as const, trendValue: 'نشط' },
    { title: 'المحالون للتعليم والمتابعة', value: data.total_follow_up.value, icon: <BookOpen size={24} />, bgColor: '#F3E8FF', color: '#A855F7', trend: 'up' as const, trendValue: 'متابعة' },
    { title: 'من أسلموا', value: data.total_converted.value, icon: <UserCheck size={24} />, bgColor: '#D1FAE5', color: '#10B981', trend: 'up' as const, trendValue: 'بفضل الله' },
    { title: 'من رفضوا', value: data.total_rejected.value, icon: <UserX size={24} />, bgColor: '#FEE2E2', color: '#EF4444', trend: 'down' as const, trendValue: '-' },
    { title: 'إجمالي الحالات المسجلة', value: data.total_cases.value, icon: <Send size={24} />, bgColor: '#FFEDD5', color: '#F97316', trend: 'up' as const, trendValue: 'نشط' },
    { title: 'إجمالي الأفراد المسجلين', value: data.total_individuals.value, icon: <Users size={24} />, bgColor: '#F1F5F9', color: '#64748B', trend: 'up' as const, trendValue: 'إجمالي' },
  ];

  // ─── Presence Donut Chart Data ────────────────────────────────
  const presenceData = [
    { name: 'اونلاين', value: data.preacher_presence.online, color: '#10B981' },
    { name: 'مشغول', value: data.preacher_presence.busy, color: '#F59E0B' },
    { name: 'اوفالايين', value: data.preacher_presence.offline, color: '#EF4444' },
  ];
  const totalPreachers = data.preacher_presence.online + data.preacher_presence.busy + data.preacher_presence.offline;

  // ─── Nationality Distribution Data ────────────────────────────
  const nationalityStyles = [
    { fill: '#FF4D4F', bg: '#FFF1F0' }, // Red
    { fill: '#1890FF', bg: '#E6F7FF' }, // Blue
    { fill: '#FFA940', bg: '#FFF7E6' }, // Orange
    { fill: '#722ED1', bg: '#F9F0FF' }, // Purple
    { fill: '#13C2C2', bg: '#E6FFFB' }, // Teal
    { fill: '#52C41A', bg: '#F6FFED' }, // Green
  ];

  const governorates = data.nationalities_distribution.map((item, idx) => {
    const style = nationalityStyles[idx % nationalityStyles.length];
    return {
      name: item.label,
      count: `${item.value.toLocaleString()} شخص`,
      percentage: Math.min(100, (item.value / (data.total_individuals.value || 1)) * 100),
      color: style.fill,
      bgColor: style.bg
    };
  });

  return (
    <div className="admin-dashboard">
      <h1 className="ad-title">الداشبورد</h1>

      {/* ── Stat Cards ── */}
      <div className="ad-stats-grid">
        {statCards.map((stat, idx) => (
          <StatCard
            key={idx}
            title={stat.title}
            value={stat.value.toString()}
            icon={stat.icon}
            iconBgColor={stat.bgColor}
            iconColor={stat.color}
            trend={stat.trend}
            trendValue={stat.trendValue}
          />
        ))}
      </div>

      {/* ── Tables Row ── */}
      <div className="ad-tables-row">
        {/* Associations Stats */}
        <div className="ad-card ad-table-card">
          <h3 className="ad-card-title">احصائيات الجمعيات</h3>
          <table className="ad-table">
            <thead>
              <tr>
                <th>رقم</th>
                <th>اسم الجمعية</th>
                <th>عدد الدعاة</th>
              </tr>
            </thead>
            <tbody>
              {data.organization_stats.map((row) => (
                <tr key={row.org_id}>
                  <td>{row.org_id}</td>
                  <td>{row.organization_name}</td>
                  <td>{row.preachers_count}</td>
                </tr>
              ))}
              {data.organization_stats.length === 0 && (
                <tr><td colSpan={3} style={{textAlign:'center', padding:'20px'}}>لا توجد بيانات متاحة</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Top Preachers */}
        <div className="ad-card ad-table-card">
          <h3 className="ad-card-title">نشاط أفضل 10 دعاة</h3>
          <table className="ad-table">
            <thead>
              <tr>
                <th>رقم</th>
                <th>اسم الداعية</th>
                <th>اسم الجمعية</th>
                <th>نسبة النجاح</th>
              </tr>
            </thead>
            <tbody>
              {data.top_preachers.map((row) => (
                <tr key={row.preacher_id}>
                  <td>{row.preacher_id}</td>
                  <td>{row.full_name}</td>
                  <td>{row.organization_name || 'غير محدد'}</td>
                  <td>
                    <div className="ad-progress-wrapper">
                      <span className="ad-progress-label">{row.success_rate}%</span>
                      <div className="ad-progress-bg">
                        <div className="ad-progress-fill" style={{ width: `${row.success_rate}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {data.top_preachers.length === 0 && (
                <tr><td colSpan={4} style={{textAlign:'center', padding:'20px'}}>لا توجد بيانات متاحة</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="ad-charts-row">
        {/* Donut Chart */}
        <div className="ad-card ad-chart-card">
          <h3 className="ad-card-title">حالة تواجد الدعاة الان</h3>
          <div className="ad-donut-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={presenceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {presenceData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} داعية`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="ad-donut-center">
              <span className="ad-donut-total">{totalPreachers}</span>
              <span className="ad-donut-label">داعية</span>
            </div>
          </div>
          <div className="ad-donut-legend">
            {presenceData.map((item, idx) => (
              <div key={idx} className="ad-legend-item">
                <span className="ad-legend-dot" style={{ backgroundColor: item.color }} />
                <span className="ad-legend-name">{item.name}</span>
                <span className="ad-legend-val">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nationality Distribution Section */}
        <div className="ad-card ad-map-card">
          <h3 className="ad-card-title">جنسية المدعوين</h3>
          <div className="ad-world-map-wrapper">
             <WorldMap data={data.nationalities_distribution} colors={nationalityStyles.map(s => s.fill)} />
          </div>
          <div className="ad-gov-list">
            {governorates.map((gov, idx) => (
              <div key={idx} className="ad-gov-row-modern">
                <div className="ad-gov-header-modern">
                  <span className="ad-gov-name-modern">{gov.name}</span>
                  <span className="ad-gov-count-modern">{gov.count}</span>
                </div>
                <div className="ad-progress-bg-modern" style={{ backgroundColor: gov.bgColor }}>
                  <div
                    className="ad-progress-fill-modern"
                    style={{ width: `${gov.percentage}%`, backgroundColor: gov.color }}
                  />
                </div>
              </div>
            ))}
            {governorates.length === 0 && (
              <p style={{textAlign:'center', color:'#94a3b8', marginTop:'20px'}}>لا توجد بيانات توزيع متاحة</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
