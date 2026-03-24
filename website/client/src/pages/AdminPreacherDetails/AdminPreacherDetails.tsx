import { useNavigate, useParams } from 'react-router-dom';
import { 
  User, 
  MessageCircle, 
  Moon, 
  Settings, 
  Mail, 
  Phone, 
  Building2,
  ChevronLeft,
  FileText,
  UserCheck,
  ClipboardList
} from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import ResponseTimeChart from '../../components/ResponseTimeChart/ResponseTimeChart';
import './AdminPreacherDetails.css';

const governorates = [
  { name: 'محافظة العاصمة',    count: '72 الف شخص', percentage: 72, color: '#F59E0B' },
  { name: 'محافظة الأحمدي',   count: '60 الف شخص', percentage: 60, color: '#EC4899' },
  { name: 'محافظة الفروانية', count: '50 الف شخص', percentage: 50, color: '#10B981' },
  { name: 'محافظة حولي',      count: '40 الف شخص', percentage: 40, color: '#6366F1' },
  { name: 'محافظة الجهراء',   count: '30 الف شخص', percentage: 30, color: '#3B82F6' },
  { name: 'محافظة مبارك الكبير', count: '20 الف شخص', percentage: 20, color: '#E11D48' },
];

const mockStats = [
  { id: 1, title: 'اجمالي عدد الطلبات',          value: '100',  icon: <FileText size={24} />,     bgColor: '#FEF3C7', color: '#F59E0B' },
  { id: 2, title: 'عدد من اسلموا',               value: '100',  icon: <UserCheck size={24} />,    bgColor: '#D1FAE5', color: '#10B981' },
  { id: 3, title: 'اجمالي قيد الاقتناع',         value: '100',  icon: <ClipboardList size={24} />,bgColor: '#FCE7F3', color: '#EC4899' },
  { id: 4, title: 'عدد من رفضوا',                value: '100',  icon: <FileText size={24} />,     bgColor: '#FEE2E2', color: '#EF4444' },
];

const AdminPreacherDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Using the id for navigation if needed

  return (
    <div className="apreach-page">
      {/* ── Breadcrumb & Title ── */}
      <div className="apreach-header">
        <div className="apreach-breadcrumb">
          <span 
            className="apreach-crumb-link" 
            onClick={() => id ? navigate(`/admin/associations/${id}`) : navigate('/admin/callers')}
          >
            {id ? 'دعاة الجمعية' : 'دعاة الجمعيات'}
          </span>
          <ChevronLeft size={16} className="apreach-crumb-icon" />
          <span className="apreach-crumb-current">عرض تفاصيل الداعية</span>
        </div>
        <h1 className="apreach-title">عرض تفاصيل الداعية</h1>
      </div>

      {/* ── Data section ── */}
      <div className="apreach-card">
        <div className="apreach-grid">
          <div className="apreach-item">
            <span className="apreach-label"><User size={16}/> اسم الداعية</span>
            <span className="apreach-value">احمد عاطف</span>
          </div>
          <div className="apreach-item">
            <span className="apreach-label"><MessageCircle size={16}/> اللغة</span>
            <span className="apreach-value">اللغة الفرنسية، الانجليزية</span>
          </div>
          <div className="apreach-item">
            <span className="apreach-label"><Moon size={16}/> الديانة</span>
            <span className="apreach-value">مسلم</span>
          </div>
          <div className="apreach-item">
            <span className="apreach-label"><Settings size={16}/> الحالة</span>
            <span className="apreach-value status-inactive">غير مفعل</span>
          </div>

          <div className="apreach-item">
            <span className="apreach-label"><Mail size={16}/> البريد الالكتروني</span>
            <span className="apreach-value ltr-fix">john2025@gmail.com</span>
          </div>
          <div className="apreach-item">
            <span className="apreach-label"><Phone size={16}/> رقم الهاتف</span>
            <span className="apreach-value ltr-fix">+2001155591759</span>
          </div>
          <div className="apreach-item">
            <span className="apreach-label"><Building2 size={16}/> اسم الجمعية</span>
            <span className="apreach-value">جمعية رسالة الاسلام</span>
          </div>
          {/* Empty Item for alignment */}
          <div className="apreach-item"></div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="apreach-stats-grid">
        {mockStats.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconBgColor={stat.bgColor}
            iconColor={stat.color}
            trend={stat.id % 2 === 0 ? 'down' : 'up'}
            trendValue={stat.id % 2 === 0 ? 'الشهر الماضي 10.5% ^' : 'الشهر الماضي 10.5% v'}
          />
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="apreach-charts-grid">
        <div className="apreach-chart-card main-chart">
          <div className="apreach-chart-header row-between">
            <h3>سرعة الاستجابة الاولي</h3>
            <select className="apreach-chart-select">
              <option>اشهر</option>
            </select>
          </div>
          <div className="apreach-chart-content">
            <ResponseTimeChart />
          </div>
        </div>
        <div className="apreach-chart-card side-map">
          <div className="apreach-chart-header">
            <h3>توزيع المدعوين بمحافظات الكويت</h3>
          </div>
          <div className="apreach-chart-content map-wrapper">
            <img
              src="/image 1.png"
              alt="خريطة الكويت"
              className="apreach-kuwait-map"
            />
            <div className="apreach-gov-list">
              {governorates.map((gov, idx) => (
                <div key={idx} className="apreach-gov-row">
                  <div className="apreach-gov-header">
                    <span className="apreach-gov-name">{gov.name}</span>
                    <span className="apreach-gov-count">{gov.count}</span>
                  </div>
                  <div className="apreach-gov-progress">
                    <div
                      className="apreach-gov-fill"
                      style={{ width: `${gov.percentage}%`, backgroundColor: gov.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPreacherDetails;
