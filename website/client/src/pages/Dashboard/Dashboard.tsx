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
  BookOpen
} from 'lucide-react';
import './Dashboard.css';

// Using mock data based on the provided design
const mockStats = [
  { id: 1, title: 'اجمالي عدد الدعاة', value: '100', icon: <Users size={24} />, bgColor: '#E0E7FF', color: '#6366F1', trend: 'up' as const, trendValue: '10.5%+' },
  { id: 2, title: 'عدد المحادثات الجديدة', value: '100', icon: <FileText size={24} />, bgColor: '#FEF3C7', color: '#D97706', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 3, title: 'عدد المحادثات المفتوحة', value: '100', icon: <MessageCircle size={24} />, bgColor: '#D1FAE5', color: '#10B981', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 4, title: 'عدد المستفيدين', value: '100', icon: <UserCheck size={24} />, bgColor: '#FEE2E2', color: '#EF4444', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 5, title: 'المحالون للتعليم و المتابعة', value: '100', icon: <BookOpen size={24} />, bgColor: '#E0E7FF', color: '#6366F1', trend: 'up' as const, trendValue: '10.5%+' },
  { id: 6, title: 'اجمالي عدد المحادثات', value: '100', icon: <FileText size={24} />, bgColor: '#FEF3C7', color: '#D97706', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 7, title: 'من اسلموا', value: '100', icon: <UserCheck size={24} />, bgColor: '#D1FAE5', color: '#10B981', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 8, title: 'من رفضوا', value: '100', icon: <UserX size={24} />, bgColor: '#FEE2E2', color: '#EF4444', trend: 'down' as const, trendValue: '10.5%-' },
];

const Dashboard = () => {
  return (
    <div className="dashboard-page">
      <h1 className="page-title">الداشبورد</h1>
      
      <div className="dashboard-grid">
        {/* Top 8 Stats Cards */}
        <div className="stats-grid">
          {mockStats.map((stat) => (
            <StatCard 
              key={stat.id}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconBgColor={stat.bgColor}
              iconColor={stat.color}
              trend={stat.trend}
              trendValue={stat.trendValue}
            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3>الجنسيات الاكثر تفاعل</h3>
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

export default Dashboard;
