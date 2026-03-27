import { useEffect, useState } from 'react';
import StatCard from '../../components/StatCard/StatCard';
import RequestsChart from '../../components/RequestsChart/RequestsChart';
import ConversionsChart from '../../components/ConversionsChart/ConversionsChart';
import NationalitiesChart from '../../components/NationalitiesChart/NationalitiesChart';
import { orgService } from '../../services/orgService';
import { 
  Users, 
  FileText, 
  MessageCircle, 
  UserCheck, 
  UserX,
  BookOpen,
  Loader2,
  AlertCircle
} from 'lucide-react';
import './Dashboard.css';

interface StatCardData {
  title: string;
  value: number;
  change_percentage: number;
  is_positive: boolean;
}

interface ChartItem {
  label: string;
  value: number;
}

interface DashboardData {
  total_preachers:       StatCardData;
  new_requests_today:    StatCardData;
  active_conversations:  StatCardData;
  total_beneficiaries:   StatCardData;
  needs_followup_count:  StatCardData;
  total_messages:        StatCardData;
  total_converts:        StatCardData;
  total_rejections:      StatCardData;
  top_nationalities:     ChartItem[];
  requests_distribution: ChartItem[];
  conversion_trends:     ChartItem[];
}

const STAT_ICONS = [
  { icon: <Users size={24} />,         bgColor: '#E0E7FF', color: '#6366F1' },
  { icon: <FileText size={24} />,       bgColor: '#FEF3C7', color: '#D97706' },
  { icon: <MessageCircle size={24} />,  bgColor: '#D1FAE5', color: '#10B981' },
  { icon: <UserCheck size={24} />,      bgColor: '#FEE2E2', color: '#EF4444' },
  { icon: <BookOpen size={24} />,       bgColor: '#E0E7FF', color: '#6366F1' },
  { icon: <FileText size={24} />,       bgColor: '#FEF3C7', color: '#D97706' },
  { icon: <UserCheck size={24} />,      bgColor: '#D1FAE5', color: '#10B981' },
  { icon: <UserX size={24} />,          bgColor: '#FEE2E2', color: '#EF4444' },
];

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const result = await orgService.getDashboardStats();
        setData(result);
      } catch (err: unknown) {
        console.error('Dashboard fetch error:', err);
        setError('تعذّر تحميل البيانات، يرجى المحاولة مرة أخرى');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page dashboard-loading">
        <Loader2 size={40} className="spin-icon" />
        <p>جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-page dashboard-error">
        <AlertCircle size={40} color="#EF4444" />
        <p>{error || 'حدث خطأ غير متوقع'}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const statCards = [
    { key: 'total_preachers',      ...data.total_preachers,      ...STAT_ICONS[0] },
    { key: 'new_requests_today',   ...data.new_requests_today,   ...STAT_ICONS[1] },
    { key: 'active_conversations', ...data.active_conversations, ...STAT_ICONS[2] },
    { key: 'total_beneficiaries',  ...data.total_beneficiaries,  ...STAT_ICONS[3] },
    { key: 'needs_followup_count', ...data.needs_followup_count, ...STAT_ICONS[4] },
    { key: 'total_messages',       ...data.total_messages,        ...STAT_ICONS[5] },
    { key: 'total_converts',       ...data.total_converts,        ...STAT_ICONS[6] },
    { key: 'total_rejections',     ...data.total_rejections,      ...STAT_ICONS[7] },
  ];

  return (
    <div className="dashboard-page">
      <h1 className="page-title">الداشبورد</h1>
      
      <div className="dashboard-grid">
        {/* Top 8 Stats Cards */}
        <div className="stats-grid">
          {statCards.map((stat) => (
            <StatCard 
              key={stat.key}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconBgColor={stat.bgColor}
              iconColor={stat.color}
              trend={stat.is_positive ? 'up' : 'down'}
              trendValue={`${stat.change_percentage}%`}
            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          <div className="chart-card awqaf-kuwait-card">
            <h3 className="awqaf-kuwait-title">توزيع المدعوين</h3>
            <div className="chart-content">
              <NationalitiesChart data={data.top_nationalities} />
            </div>
          </div>
          <div className="chart-card">
            <h3>اجمالي الطلبات</h3>
            <div className="chart-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <RequestsChart data={data.requests_distribution} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-header">
              <h3>من اسلموا / رفضوا</h3>
              <select className="chart-select">
                <option>اشهر</option>
              </select>
            </div>
            <div className="chart-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '250px' }}>
              <ConversionsChart data={data.conversion_trends} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
