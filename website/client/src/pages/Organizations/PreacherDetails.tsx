import React from 'react';
import { 
  ChevronLeft, 
  User, 
  Languages, 
  Globe2, 
  Mail, 
  Phone, 
  Building2, 
  LayoutGrid,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import WorldMap from '../../components/WorldMap/WorldMap';
import './PreacherDetails.css';

const PreacherDetails: React.FC = () => {
  const { id: _id } = useParams();

  // Mock data for the preacher
  const preacherData = {
    name: 'احمد عاطف',
    languages: 'اللغة الفرنسية، الانجليزية',
    religion: 'مسيحي',
    email: 'John2025@gmail.com',
    phone: '+2001155591759',
    organization: 'جمعية رسالة الاسلام',
    status: 'غير مفعل'
  };

  const kpiStats = [
    { title: 'إجمالي عدد الطلبات', value: 100, trend: '+10.5%', isUp: true, icon: <FileText size={20} />, color: 'gold' },
    { title: 'عدد من أسلموا', value: 100, trend: '-10.5%', isUp: false, icon: <CheckCircle2 size={20} />, color: 'green' },
    { title: 'إجمالي قيد الاقناع', value: 100, trend: '+10.5%', isUp: true, icon: <Clock size={20} />, color: 'purple' },
    { title: 'عدد من رفضوا', value: 100, trend: '-10.5%', isUp: false, icon: <XCircle size={20} />, color: 'red' },
  ];

  const responseSpeedData = [
    { name: 'يناير', speed: 10 },
    { name: 'فبراير', speed: 8 },
    { name: 'مارس', speed: 12 },
    { name: 'ابريل', speed: 18 },
    { name: 'مايو', speed: 10 },
    { name: 'يونيو', speed: 11 },
    { name: 'يوليو', speed: 7 },
    { name: 'اغسطس', speed: 9 },
    { name: 'سبتمبر', speed: 11 },
    { name: 'اكتوبر', speed: 8 },
    { name: 'نوفمبر', speed: 6 },
    { name: 'ديسمبر', speed: 4 },
  ];

  const nationalities = [
    { country: 'الولايات المتحدة الأمريكية', count: '72 الف شخص', percentage: 75, color: '#ef4444' },
    { country: 'المملكة المتحدة', count: '50 الف شخص', percentage: 55, color: '#3b82f6' },
    { country: 'استراليا', count: '40 الف شخص', percentage: 45, color: '#f59e0b' },
    { country: 'امريكا الجنوبية', count: '30 الف شخص', percentage: 35, color: '#8b5cf6' },
    { country: 'الاكوادور', count: '20 الف شخص', percentage: 25, color: '#10b981' },
  ];

  return (
    <div className="preacher-details-page" dir="rtl">
      {/* Breadcrumbs */}
      <div className="breadcrumb-area">
        <nav className="breadcrumbs">
          <Link to="/organizations">الجمعيات</Link>
          <ChevronLeft size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-text">دعاة الجمعية</span>
          <ChevronLeft size={14} className="breadcrumb-separator" />
          <span className="current-page">عرض تفاصيل الداعية</span>
        </nav>
        <h1 className="page-title-main">عرض تفاصيل الداعية</h1>
      </div>

      {/* Personal Info Card */}
      <div className="preacher-info-card section-card">
        <div className="info-grid personal-info">
          <div className="info-item">
            <div className="info-label"><User size={16} /> اسم الداعية</div>
            <div className="info-value">{preacherData.name}</div>
          </div>
          <div className="info-item">
            <div className="info-label"><Languages size={16} /> اللغة</div>
            <div className="info-value">{preacherData.languages}</div>
          </div>
          <div className="info-item">
            <div className="info-label"><Globe2 size={16} /> الديانة</div>
            <div className="info-value">{preacherData.religion}</div>
          </div>
          <div className="info-item">
            <div className="info-label"><LayoutGrid size={16} /> الحالة</div>
            <div className="info-value status-inactive">{preacherData.status}</div>
          </div>
          <div className="info-item">
            <div className="info-label"><Mail size={16} /> البريد الالكتروني</div>
            <div className="info-value">{preacherData.email}</div>
          </div>
          <div className="info-item">
            <div className="info-label"><Phone size={16} /> رقم الهاتف</div>
            <div className="info-value">{preacherData.phone}</div>
          </div>
          <div className="info-item">
            <div className="info-label"><Building2 size={16} /> اسم الجمعية</div>
            <div className="info-value">{preacherData.organization}</div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid-row">
        {kpiStats.map((stat, idx) => (
          <div key={idx} className="stat-card-mini animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="stat-card-main">
              <div className="stat-info">
                <p className="stat-title">{stat.title}</p>
                <h2 className="stat-number">{stat.value}</h2>
                <div className={`stat-trend ${stat.isUp ? 'up' : 'down'}`}>
                  <span>الشهر الماضي {stat.trend}</span>
                  {/* Icon added in CSS or via lucide if needed, screenshot shows small arrows */}
                </div>
              </div>
              <div className={`stat-icon-wrapper ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="preacher-charts-row">
        {/* Nationalities Breakdown */}
        <div className="chart-card nationalities-breakdown animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="chart-header">
            <h3 className="chart-title">البلدان</h3>
          </div>
          <div className="chart-body">
            <div className="map-wrapper-contain">
              <WorldMap />
            </div>
            <div className="nat-progress-list">
              {nationalities.map((item, idx) => (
                <div key={idx} className="nat-row">
                  <div className="nat-text">
                    <span className="nat-name">{item.country}</span>
                    <span className="nat-count">{item.count}</span>
                  </div>
                  <div className="nat-progress-bg">
                    <div 
                      className="nat-progress-fill" 
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Initial Response Speed Line Chart */}
        <div className="chart-card response-speed-chart animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="chart-header">
            <h3 className="chart-title">سرعة الاستجابة الاولي</h3>
            <div className="chart-filter-select">
              <span>الشهر</span> <ChevronDown size={14} />
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={responseSpeedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DBA841" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#DBA841" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} label={{ value: 'دقيقة', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="speed" 
                  stroke="#DBA841" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSpeed)" 
                  dot={{ r: 4, fill: '#DBA841', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="chart-y-labels-custom">
              {/* Optional custom labels if recharts defaults don't match exactly */}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="pixel-perfect-footer">v4.1.4 Pixel Perfect</div>
    </div>
  );
};

export default PreacherDetails;
