import StatCard from '../../components/StatCard/StatCard';
import RequestsChart from '../../components/RequestsChart/RequestsChart';
import ConversionsChart from '../../components/ConversionsChart/ConversionsChart';
import NationalitiesChart from '../../components/NationalitiesChart/NationalitiesChart';
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
  { id: 1, title: 'اجمالي عدد الدعاة',          value: '133',  icon: <Users size={24} />,        bgColor: '#EDE9FE', color: '#7C3AED' },
  { id: 2, title: 'اجمالي عدد طلبات الجمعية',   value: '10',   icon: <FileText size={24} />,     bgColor: '#FEF9C3', color: '#CA8A04' },
  { id: 3, title: 'اجمالي عدد المحادثات',        value: '2350', icon: <MessageCircle size={24} />, bgColor: '#D1FAE5', color: '#059669' },
  { id: 4, title: 'المجالون للتعليم و المتابعة', value: '89',   icon: <BookOpen size={24} />,     bgColor: '#FEE2E2', color: '#DC2626' },
  { id: 5, title: 'اجمالي عدد الدعاة',           value: '100',  icon: <Users size={24} />,        bgColor: '#EDE9FE', color: '#7C3AED' },
  { id: 6, title: 'اجمالي عدد طلبات الجمعية',   value: '100',  icon: <FileText size={24} />,     bgColor: '#FEF9C3', color: '#CA8A04' },
  { id: 7, title: 'من اسلموا',                   value: '100',  icon: <UserCheck size={24} />,    bgColor: '#D1FAE5', color: '#059669' },
  { id: 8, title: 'من رفضوا',                    value: '100',  icon: <UserX size={24} />,        bgColor: '#FEE2E2', color: '#DC2626' },
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
              iconColor={stat.color} trend={'up'} trendValue={''}            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>جنسيات الاشخاص المدعوين</h3>
            <div className="chart-content">
              <NationalitiesChart />
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
