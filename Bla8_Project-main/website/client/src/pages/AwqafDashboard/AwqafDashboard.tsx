import StatCard from '../../components/StatCard/StatCard';
import RequestsChart from '../../components/RequestsChart/RequestsChart';
import ConversionsChart from '../../components/ConversionsChart/ConversionsChart';
import {
  Users,
  FileText,
  MessageCircle,
  UserCheck,
  UserX,
  BookOpen,
} from 'lucide-react';
import './AwqafDashboard.css';

const mockStats = [
  { id: 1, title: 'اجمالي عدد الجمعيات', value: '100', icon: <Users size={24} />, bgColor: '#E0E7FF', color: '#6366F1', trend: 'up' as const, trendValue: '10.5%+' },
  { id: 2, title: 'عدد المحادثات الجديدة', value: '100', icon: <FileText size={24} />, bgColor: '#FEF3C7', color: '#D97706', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 3, title: 'عدد المحادثات المفتوحة', value: '100', icon: <MessageCircle size={24} />, bgColor: '#D1FAE5', color: '#10B981', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 4, title: 'عدد المستفيدين', value: '100', icon: <UserCheck size={24} />, bgColor: '#FEE2E2', color: '#EF4444', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 5, title: 'المحالون للتعليم و المتابعة', value: '100', icon: <BookOpen size={24} />, bgColor: '#E0E7FF', color: '#6366F1', trend: 'up' as const, trendValue: '10.5%+' },
  { id: 6, title: 'اجمالي عدد المحادثات', value: '100', icon: <FileText size={24} />, bgColor: '#FEF3C7', color: '#D97706', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 7, title: 'من اسلموا', value: '100', icon: <UserCheck size={24} />, bgColor: '#D1FAE5', color: '#10B981', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 8, title: 'من رفضوا', value: '100', icon: <UserX size={24} />, bgColor: '#FEE2E2', color: '#EF4444', trend: 'down' as const, trendValue: '10.5%-' },
];

const AwqafDashboard = () => {
  return (
    <div className="dashboard-page">
      <h1 className="page-title">الداشبورد</h1>

      <div className="dashboard-grid">
        {/* Stats Cards */}
        <div className="stats-grid">
          {mockStats.map((stat) => (
            <StatCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconBgColor={stat.bgColor}
              iconColor={stat.color}
              trend={stat.trend as 'up' | 'down'}
              trendValue={stat.trendValue}
            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          <div className="chart-card awqaf-kuwait-card">
            <h3 className="awqaf-kuwait-title">توزيع المدعوين بمحافظات الكويت</h3>
            <div className="awqaf-kuwait-map-wrap">
              <img src="/image 1.png" alt="خريطة الكويت" className="awqaf-kuwait-map-img" />
            </div>
            <div className="awqaf-gov-grid">
              {[
                { name: 'محافظة العاصمة',    value: 72, color: '#F59E0B' },
                { name: 'محافظة الأحمدي',   value: 60, color: '#EC4899' },
                { name: 'محافظة الفروانية', value: 50, color: '#10B981' },
                { name: 'محافظة حولي',       value: 40, color: '#8B5CF6' },
                { name: 'محافظة الجهراء',   value: 30, color: '#EF4444' },
                { name: 'محافظة مبارك الكبير', value: 20, color: '#3B82F6' },
              ].map(gov => (
                <div key={gov.name} className="awqaf-gov-item">
                  <span className="awqaf-gov-name">{gov.name}</span>
                  <div className="awqaf-gov-bar-wrap">
                    <div
                      className="awqaf-gov-bar"
                      style={{ width: `${(gov.value / 72) * 100}%`, background: gov.color }}
                    />
                  </div>
                  <span className="awqaf-gov-value">{gov.value} ألف شخص</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-card">
            <h3>اجمالي الطلبات</h3>
            <div className="chart-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <RequestsChart />
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
              <ConversionsChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AwqafDashboard;
