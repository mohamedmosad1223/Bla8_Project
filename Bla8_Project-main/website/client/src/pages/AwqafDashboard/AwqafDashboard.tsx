import { useEffect, useState } from 'react';
import StatCard from '../../components/StatCard/StatCard';
import RequestsChart from '../../components/RequestsChart/RequestsChart';
import ConversionsChart from '../../components/ConversionsChart/ConversionsChart';
import { ministerService } from '../../services/ministerService';
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
import './AwqafDashboard.css';

const STAT_ICONS_MAP: Record<string, { icon: JSX.Element; bgColor: string; color: string }> = {
  preachers: { icon: <Users size={24} />, bgColor: '#E0E7FF', color: '#6366F1' },
  requests: { icon: <FileText size={24} />, bgColor: '#FEF3C7', color: '#D97706' },
  messages: { icon: <MessageCircle size={24} />, bgColor: '#D1FAE5', color: '#10B981' },
  referrals: { icon: <BookOpen size={24} />, bgColor: '#E0E7FF', color: '#6366F1' },
  converted: { icon: <UserCheck size={24} />, bgColor: '#D1FAE5', color: '#10B981' },
  rejected: { icon: <UserX size={24} />, bgColor: '#FEE2E2', color: '#EF4444' },
  cases: { icon: <FileText size={24} />, bgColor: '#FEF3C7', color: '#D97706' },
  individuals: { icon: <Users size={24} />, bgColor: '#E0E7FF', color: '#6366F1' },
};

const AwqafDashboard = () => {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const result = await ministerService.getDashboardStats();
        setData(result);
      } catch (err: unknown) {
        console.error('Minister Dashboard fetch error:', err);
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

  return (
    <div className="dashboard-page">
      <h1 className="page-title">الداشبورد</h1>

      <div className="dashboard-grid">
        {/* Stats Cards */}
        <div className="stats-grid">
          {data.top_cards.map((stat: { title: string; value: number | string; icon: string }, idx: number) => {
            const config = STAT_ICONS_MAP[stat.icon] || STAT_ICONS_MAP.preachers;
            return (
              <StatCard
                key={idx}
                title={stat.title}
                value={stat.value.toString()}
                icon={config.icon}
                iconBgColor={config.bgColor}
                iconColor={config.color}
                trend="up"
                trendValue="10.5%+"
              />
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          <div className="chart-card awqaf-kuwait-card">
            <h3 className="awqaf-kuwait-title">توزيع المدعوين بمحافظات الكويت</h3>
            <div className="awqaf-kuwait-map-wrap">
              <img src="/image 1.png" alt="خريطة الكويت" className="awqaf-kuwait-map-img" />
            </div>
            <div className="awqaf-gov-grid">
              {data.governorates.map((gov: { name: string; value: number }) => {
                 const total = data.governorates[0]?.value || 1;
                 return (
                  <div key={gov.name} className="awqaf-gov-item">
                    <span className="awqaf-gov-name">{gov.name}</span>
                    <div className="awqaf-gov-bar-wrap">
                      <div
                        className="awqaf-gov-bar"
                        style={{ width: `${(gov.value / total) * 100}%`, background: '#DBA841' }}
                      />
                    </div>
                    <span className="awqaf-gov-value">{gov.value} شخص</span>
                  </div>
                 );
              })}
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

export default AwqafDashboard;
