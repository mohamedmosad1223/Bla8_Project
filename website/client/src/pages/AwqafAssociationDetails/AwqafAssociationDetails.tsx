import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  User, 
  CheckCircle, 
  Eye,
  ChevronLeft,
  Search,
  Filter,
  Users,
  UserCheck,
  UserX
} from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import RequestsChart from '../../components/RequestsChart/RequestsChart';
import ConversionsChart from '../../components/ConversionsChart/ConversionsChart';
import NationalitiesChart from '../../components/NationalitiesChart/NationalitiesChart';
import './AwqafAssociationDetails.css';

const mockPreachers = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  number: '123456',
  name: 'جون سميث',
  nationality: i % 2 === 0 ? 'فرنسا' : 'انجلترا',
  joinDate: '22/02/2023\n7:00 AM',
  languages: 'الانجليزية، الفرنسية',
  active: i % 2 === 0,
}));

const mockStats = [
  { id: 1, title: 'اجمالي عدد الدعاة',          value: '100',  icon: <Users size={24} />,        bgColor: '#EDE9FE', color: '#7C3AED' },
  { id: 2, title: 'اجمالي عدد طلبات الجمعية',   value: '100',  icon: <FileText size={24} />,     bgColor: '#FEF9C3', color: '#CA8A04' },
  { id: 3, title: 'من اسلموا',                   value: '100',  icon: <UserCheck size={24} />,    bgColor: '#D1FAE5', color: '#059669' },
  { id: 4, title: 'من رفضوا',                    value: '100',  icon: <UserX size={24} />,        bgColor: '#FEE2E2', color: '#DC2626' },
];

const AwqafAssociationDetails = () => {
  const navigate = useNavigate();
  const { id: assocId } = useParams();
  const [activeTab, setActiveTab] = useState<'data' | 'preachers'>('data');
  const [search, setSearch] = useState('');

  return (
    <div className="awqaf-assoc-details-page">
      {/* Breadcrumb & Title */}
      <div className="details-header">
        <div className="breadcrumb">
          <span className="breadcrumb-link" onClick={() => navigate('/awqaf/associations')}>
            الجمعيات
          </span>
          <ChevronLeft size={16} />
          <span className="breadcrumb-current">عرض تفاصيل الجمعية</span>
        </div>
        <h1 className="page-title">عرض تفاصيل الجمعية</h1>
      </div>

      {/* Tabs */}
      <div className="details-tabs">
        <button 
          className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          عرض بيانات الجمعية
        </button>
        <button 
          className={`tab-btn ${activeTab === 'preachers' ? 'active' : ''}`}
          onClick={() => setActiveTab('preachers')}
        >
          عرض دعاة الجمعية
        </button>
      </div>

      {/* Tab Content: Data */}
      {activeTab === 'data' && (
        <div className="tab-content data-tab">
          <div className="data-card">
            <div className="data-section">
              <div className="section-header">
                <h3>بيانات الجمعية</h3>
              </div>
              <div className="data-grid-layout">
                <div className="data-item">
                  <span className="data-label"><Building2 size={16}/> اسم الجمعية</span>
                  <span className="data-value">جمعية رسالة الاسلام</span>
                </div>
                <div className="data-item">
                  <span className="data-label"><FileText size={16}/> رقم الترخيص</span>
                  <span className="data-value with-icon" style={{ direction: 'ltr', justifyContent: 'flex-end', width: '100%' }}><Eye size={16}/> 12345678</span>
                </div>
                <div className="data-item">
                  <span className="data-label"><Mail size={16}/> البريد الألكتروني</span>
                  <span className="data-value">John2025@gmail.com</span>
                </div>
                <div className="data-item">
                  <span className="data-label"><Phone size={16}/> رقم الهاتف</span>
                  <span className="data-value" style={{direction: 'ltr', justifyContent: 'flex-end', width: '100%'}}>+2001155591759</span>
                </div>
                <div className="data-item">
                  <span className="data-label"><MapPin size={16}/> البلد</span>
                  <span className="data-value">الكويت</span>
                </div>
                <div className="data-item">
                  <span className="data-label"><MapPin size={16}/> المحافظة</span>
                  <span className="data-value">المحافظة</span>
                </div>
                <div className="data-item">
                  <span className="data-label"><MapPin size={16}/> العنوان</span>
                  <span className="data-value">الكويت - شارع القادسية</span>
                </div>
                <div className="data-item">
                  <span className="data-label"><CheckCircle size={16}/> الحالة</span>
                  <span className="data-value status-active">مفعل</span>
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="data-section">
              <h3>بيانات مشرف الجمعية</h3>
              <div className="data-item single">
                <span className="data-label"><User size={16}/> اسم مشرف الجمعية</span>
                <span className="data-value">احمد عاطف</span>
              </div>
            </div>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '24px' }}>
            {mockStats.map((stat) => (
              <StatCard
                key={stat.id}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                iconBgColor={stat.bgColor}
                iconColor={stat.color} trend={'up'} trendValue={''}              />
            ))}
          </div>

          <div className="charts-grid" style={{ marginTop: '24px' }}>
            <div className="chart-card">
              <div className="chart-header" style={{ justifyContent: 'center' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '16px', borderBottom: 'none' }}>جنسيات الاشخاص المدعوين</h3>
              </div>
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
      )}

      {/* Tab Content: Preachers */}
      {activeTab === 'preachers' && (
        <div className="tab-content preachers-tab">
          <div className="preachers-controls">
            <div className="search-filter-wrapper">
              <div className="search-box">
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="ابحث"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="filter-btn"><Filter size={18} /> فلتر</button>
            </div>
            <div className="sort-wrapper">
              <span>تصنيف</span>
              <Filter size={18} />
            </div>
          </div>

          <div className="preachers-table-container">
            <table className="preachers-table">
              <thead>
                <tr>
                  <th>رقم</th>
                  <th>اسم الداعية</th>
                  <th>الجنسية</th>
                  <th>تاريخ الانضمام</th>
                  <th>اللغة</th>
                  <th>مفعل / غير مفعل</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {mockPreachers.map((preacher) => (
                  <tr key={preacher.id}>
                    <td>{preacher.number}</td>
                    <td>{preacher.name}</td>
                    <td>{preacher.nationality}</td>
                    <td className="multiline-cell">{preacher.joinDate}</td>
                    <td>{preacher.languages}</td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" defaultChecked={preacher.active} />
                        <span className="slider round"></span>
                      </label>
                    </td>
                    <td><button className="icon-btn" onClick={() => navigate(`/awqaf/associations/${assocId}/preachers/${preacher.id}`)}><Eye size={18}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AwqafAssociationDetails;
