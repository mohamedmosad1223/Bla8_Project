import { useNavigate } from 'react-router-dom';
import { Building2, Building, Users, Edit, UserCheck, FileText, Download, Image as ImageIcon } from 'lucide-react';
import RequestsChart from '../../components/RequestsChart/RequestsChart';
import ConversionsChart from '../../components/ConversionsChart/ConversionsChart';
import AcceptanceRateChart from '../../components/AcceptanceRateChart/AcceptanceRateChart';
import './AwqafAssociationReports.css';

const reportStats = [
  { id: 1, label: 'اسم الجمعية', value: 'جمعية الهداية الخيرية', icon: <Building2 size={24}/>, bgColor: '#FEF3C7', color: '#D97706' },
  { id: 2, label: 'المنطقة', value: 'محافظة الرياض', icon: <Building size={24}/>, bgColor: '#FEF3C7', color: '#D97706' },
  { id: 3, label: 'رقم الهاتف', value: '+ 966 11 234 5678', icon: <Users size={24}/>, bgColor: '#E0E7FF', color: '#4338CA' },
  { id: 4, label: 'البريد الالكتروني', value: 'info@alhidaya.org', icon: <Users size={24}/>, bgColor: '#FCE7F3', color: '#DB2777' },
  { id: 5, label: 'عدد الفروع', value: '12', icon: <Edit size={24}/>, bgColor: '#F3E8FF', color: '#7E22CE' },
  { id: 6, label: 'اجمالي الحالات المسجلة', value: '45', icon: <Edit size={24}/>, bgColor: '#F3E8FF', color: '#7E22CE' },
  { id: 7, label: 'عدد المستفيدين', value: '2,847', icon: <UserCheck size={24}/>, bgColor: '#D1FAE5', color: '#059669' },
  { id: 8, label: 'عدد الداخلين في الإسلام', value: '189', icon: <FileText size={24}/>, bgColor: '#FEE2E2', color: '#DC2626' },
];

const mockSurveys = [
  { id: 1, preacher: 'محمد أحمد العلي', meetings: 24, beneficiaries: 156, successRate: '85%', notes: 'ممتاز' },
  { id: 2, preacher: 'عبدالله سالم النهدي', meetings: 18, beneficiaries: 92, successRate: '72%', notes: 'جيد جداً' },
  { id: 3, preacher: 'عبدالله سالم النهدي', meetings: 31, beneficiaries: 203, successRate: '91%', notes: 'ممتاز' },
  { id: 4, preacher: 'يوسف عبد الرحمن القحطاني', meetings: 15, beneficiaries: 78, successRate: '68%', notes: 'جيد' },
  { id: 5, preacher: 'سعد فهد الدوسري', meetings: 27, beneficiaries: 134, successRate: '79%', notes: 'جيد جداً' },
];

const mockGeography = [
  { name: 'محافظة الحدقبة', rate: 85, color: '#10B981' },
  { name: 'محافظة الحمراء', rate: 72, color: '#3B82F6' },
  { name: 'محافظة العاصمة', rate: 91, color: '#F59E0B' },
  { name: 'محافظة أب الكبير', rate: 64, color: '#8B5CF6' },
  { name: 'محافظة النورانية', rate: 78, color: '#EF4444' },
];

const AwqafAssociationReports = () => {
  const navigate = useNavigate();

  return (
    <div className="awqaf-assoc-reports-page">
      <h1 className="page-title">تقارير جمعية الهداية الخيرية</h1>

      {/* Top Stats Grid */}
      <div className="reports-top-stats">
        {reportStats.map((stat) => (
          <div key={stat.id} className="report-stat-card">
            <div className="stat-icon" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="charts-grid-reports">
        <div className="chart-card">
          <div className="chart-header">
            <h3>من اسلموا / رفضوا</h3>
            <select className="chart-select">
              <option>الشهر</option>
            </select>
          </div>
          <div className="chart-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '250px' }}>
            <ConversionsChart />
          </div>
        </div>
        <div className="chart-card">
          <h3>حالة الطلبات</h3>
          <div className="chart-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <RequestsChart />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <h3>نسبة القبول الشهرية</h3>
            <select className="chart-select">
              <option>الشهر</option>
            </select>
          </div>
          <div className="chart-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '250px' }}>
            <AcceptanceRateChart />
          </div>
        </div>
      </div>

      {/* Surveys Table */}
      <div className="reports-section">
        <h3>الاستبيانات والتقارير الميدانية</h3>
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>اسم الداعية</th>
                <th>عدد اللقاءات</th>
                <th>عدد المستفيدين</th>
                <th>نسبة النجاح</th>
                <th>الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {mockSurveys.map((survey) => (
                <tr key={survey.id}>
                  <td>{survey.preacher}</td>
                  <td>{survey.meetings}</td>
                  <td>{survey.beneficiaries}</td>
                  <td style={{ color: 
                    parseInt(survey.successRate) > 80 ? '#10B981' : 
                    parseInt(survey.successRate) > 70 ? '#F59E0B' : '#3B82F6'
                  }}>{survey.successRate}</td>
                  <td>{survey.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geography Bars */}
      <div className="reports-section">
        <h3>التوزيع الجغرافي للأنشطة</h3>
        <div className="geography-container">
          {mockGeography.map((geo, idx) => (
            <div key={idx} className="geo-row">
              <span className="geo-name">{geo.name}</span>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${geo.rate}%`, backgroundColor: geo.color }}
                />
              </div>
              <span className="geo-rate">{geo.rate}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Files Section */}
      <div className="reports-section">
        <h3>الملفات والتقارير</h3>
        <div className="files-container">
          <button className="file-btn red-btn">
            <Download size={16} /> تحميل تقرير PDF
          </button>
          <button className="file-btn green-btn">
            <Download size={16} /> تحميل تقرير Excel
          </button>
          <button className="file-btn blue-btn">
            <ImageIcon size={16} /> عرض صور الأنشطة
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="reports-actions">
        <button className="btn-outline" onClick={() => navigate('/awqaf/associations')}>
          رجوع إلى صفحة الجمعيات
        </button>
        <button className="btn-primary">
          تصدير التقرير
        </button>
      </div>
    </div>
  );
};

export default AwqafAssociationReports;
