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
import RejectedAssociationView from './RejectedAssociationView';

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
  total_preachers: StatCardData;
  new_requests_today: StatCardData;
  active_conversations: StatCardData;
  total_beneficiaries: StatCardData;
  needs_followup_count: StatCardData;
  total_messages: StatCardData;
  total_converts: StatCardData;
  total_rejections: StatCardData;
  top_nationalities: ChartItem[];
  requests_distribution: ChartItem[];
  conversion_trends: ChartItem[];
}

const STAT_ICONS = [
  { icon: <Users size={24} />, bgColor: '#E0E7FF', color: '#6366F1' },
  { icon: <FileText size={24} />, bgColor: '#FEF3C7', color: '#D97706' },
  { icon: <MessageCircle size={24} />, bgColor: '#D1FAE5', color: '#10B981' },
  { icon: <UserCheck size={24} />, bgColor: '#FEE2E2', color: '#EF4444' },
  { icon: <BookOpen size={24} />, bgColor: '#E0E7FF', color: '#6366F1' },
  { icon: <FileText size={24} />, bgColor: '#FEF3C7', color: '#D97706' },
  { icon: <UserCheck size={24} />, bgColor: '#D1FAE5', color: '#10B981' },
  { icon: <UserX size={24} />, bgColor: '#FEE2E2', color: '#EF4444' },
];

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<'day' | 'month'>('month');

  const [isPending, setIsPending] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [orgProfile, setOrgProfile] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const profileRes = await import('../../services/authService').then(m => m.authService.getMe());
        const approvalStatus = profileRes?.extra_data?.approval_status;

        if (approvalStatus === 'pending') {
          setIsPending(true);
          setLoading(false);
          setIsInitialLoading(false);
          return;
        }

        if (approvalStatus === 'rejected') {
          setIsRejected(true);
          const orgId = profileRes?.extra_data?.org_id || JSON.parse(localStorage.getItem('userData') || '{}')?.extra_data?.org_id;
          if (orgId) {
            const fullProfile = await orgService.getById(orgId);
            setOrgProfile(fullProfile.data?.data || fullProfile.data || fullProfile);
          }
          setLoading(false);
          setIsInitialLoading(false);
          return;
        }

        const result = await orgService.getDashboardStats(granularity);
        setData(result);
      } catch (err: unknown) {
        console.error('Dashboard fetch error:', err);
        setError('تعذّر تحميل البيانات، يرجى المحاولة مرة أخرى');
      } finally {
        setLoading(false);
        setIsInitialLoading(false);
      }
    };
    fetchDashboard();
  }, [granularity]);

  if (isRejected && orgProfile) {
    return <RejectedAssociationView profile={orgProfile} />;
  }

  if (isPending) {
    return (
      <div className="pd-page" dir="rtl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#dba841', background: '#fdf7e3', padding: '3rem', borderRadius: '12px', border: '1px solid #f9ebd1', maxWidth: '500px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>حساب قيد المراجعة</h2>
          <p style={{ color: '#6b572a', lineHeight: 1.6, marginBottom: '2rem' }}>
            طلب تسجيل الجمعية الآن قيد المراجعة من قبل الإدارة. سيتم إشعارك بمجرد قبول الطلب لتتمكن من الوصول للوحة التحكم.
          </p>
          <button 
            type="button" 
            onClick={() => import('../../services/authService').then(m => m.authService.logout().then(() => window.location.href = '/'))}
            style={{ background: '#dba841', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
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
    { key: 'total_preachers', ...data.total_preachers, ...STAT_ICONS[0] },
    { key: 'new_requests_today', ...data.new_requests_today, ...STAT_ICONS[1] },
    { key: 'active_conversations', ...data.active_conversations, ...STAT_ICONS[2] },
    { key: 'total_beneficiaries', ...data.total_beneficiaries, ...STAT_ICONS[3] },
    { key: 'needs_followup_count', ...data.needs_followup_count, ...STAT_ICONS[4] },
    { key: 'total_messages', ...data.total_messages, ...STAT_ICONS[5] },
    { key: 'total_converts', ...data.total_converts, ...STAT_ICONS[6] },
    { key: 'total_rejections', ...data.total_rejections, ...STAT_ICONS[7] },
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
            <div className="chart-header-row">
              <h3>من اسلموا / رفضوا</h3>
              <div className="granularity-toggle">
                <button
                  className={granularity === 'day' ? 'active' : ''}
                  onClick={() => setGranularity('day')}
                  disabled={loading}
                >
                  يومي
                </button>
                <button
                  className={granularity === 'month' ? 'active' : ''}
                  onClick={() => setGranularity('month')}
                  disabled={loading}
                >
                  شهري
                </button>
              </div>
            </div>
            <div className="chart-content" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              flex: 1, 
              minHeight: '250px',
              position: 'relative',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s'
            }}>
              {loading && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10
                }}>
                  <Loader2 size={24} className="spin-icon" color="#DBA841" />
                </div>
              )}
              <ConversionsChart data={data.conversion_trends} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
