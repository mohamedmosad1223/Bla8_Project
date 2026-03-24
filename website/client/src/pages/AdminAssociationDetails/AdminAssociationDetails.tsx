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
  Trash2, 
  Edit2,
  ChevronLeft,
  Users,
  UserCheck,
  Eye
} from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import RequestsChart from '../../components/RequestsChart/RequestsChart';
import ConversionsChart from '../../components/ConversionsChart/ConversionsChart';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import './AdminAssociationDetails.css';

const governorates = [
  { name: 'محافظة العاصمة',    count: '72 الف شخص', percentage: 72, color: '#F59E0B' },
  { name: 'محافظة الأحمدي',   count: '60 الف شخص', percentage: 60, color: '#EC4899' },
  { name: 'محافظة الفروانية', count: '50 الف شخص', percentage: 50, color: '#10B981' },
  { name: 'محافظة حولي',      count: '40 الف شخص', percentage: 40, color: '#6366F1' },
  { name: 'محافظة الجهراء',   count: '30 الف شخص', percentage: 30, color: '#3B82F6' },
  { name: 'محافظة مبارك الكبير', count: '20 الف شخص', percentage: 20, color: '#E11D48' },
];

const mockStats = [
  { id: 1, title: 'اجمالي عدد الدعاة',          value: '100',  icon: <Users size={24} />,        bgColor: '#F3E8FF', color: '#A855F7' },
  { id: 2, title: 'اجمالي عدد طلبات الجمعية',   value: '100',  icon: <FileText size={24} />,     bgColor: '#FEF3C7', color: '#F59E0B' },
  { id: 3, title: 'من اسلموا',                   value: '100',  icon: <UserCheck size={24} />,    bgColor: '#D1FAE5', color: '#10B981' },
  { id: 4, title: 'من رفضوا',                    value: '100',  icon: <FileText size={24} />,     bgColor: '#FEE2E2', color: '#EF4444' },
];

const mockPreachers = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  number: '123456',
  name: 'جون سميث',
  nationality: i % 2 === 0 ? 'فرنسا' : 'انجلترا',
  joinDate: '22/02/2023\n7:00 AM',
  languages: 'الانجليزية، الفرنسية',
  active: i % 2 === 0,
}));

const AdminAssociationDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'data' | 'preachers'>('data');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletePreacherModal, setShowDeletePreacherModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const confirmDelete = () => {
    // Delete logic here
    setShowDeleteModal(false);
    navigate('/admin/associations');
  };

  const confirmDeletePreacher = () => {
    setShowDeletePreacherModal(false);
  };

  return (
    <div className="adetails-page">
      {/* ── Breadcrumb & Title ── */}
      <div className="adetails-header">
        <div className="adetails-breadcrumb">
          <span 
            className="adetails-crumb-link" 
            onClick={() => navigate('/admin/associations')}
          >
            الجمعيات
          </span>
          <ChevronLeft size={16} className="adetails-crumb-icon" />
          <span className="adetails-crumb-current">عرض تفاصيل الجمعية</span>
        </div>
        <h1 className="adetails-title">عرض تفاصيل الجمعية</h1>
      </div>

      {/* ── Tabs ── */}
      <div className="adetails-tabs">
        <button 
          className={`adetails-tab-btn ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          عرض بيانات الجمعية
        </button>
        <button 
          className={`adetails-tab-btn ${activeTab === 'preachers' ? 'active' : ''}`}
          onClick={() => setActiveTab('preachers')}
        >
          عرض دعاة الجمعية
        </button>
      </div>

      {/* ── Tab Content: Data ── */}
      {activeTab === 'data' && (
        <div className="adetails-content">
          <div className="adetails-card">
            
            {/* Top Section */}
            <div className="adetails-section">
              <div className="adetails-section-header">
                <h3>بيانات الجمعية</h3>
                <div className="adetails-actions">
                  <button 
                    className="adetails-icon-btn edit-btn" 
                    title="تعديل"
                    onClick={() => navigate(`/admin/associations/${id}/edit`)}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    className="adetails-icon-btn delete-btn" 
                    title="حذف"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="adetails-grid">
                <div className="adetails-item">
                  <span className="adetails-label"><Building2 size={16}/> اسم الجمعية</span>
                  <span className="adetails-value">جمعية رسالة الاسلام</span>
                </div>
                <div className="adetails-item">
                  <span className="adetails-label"><FileText size={16}/> رقم الترخيص</span>
                  <span className="adetails-value ltr-fix">12345678</span>
                </div>
                <div className="adetails-item">
                  <span className="adetails-label"><Mail size={16}/> البريد الالكتروني</span>
                  <span className="adetails-value ltr-fix">john2025@gmail.com</span>
                </div>
                <div className="adetails-item">
                  <span className="adetails-label"><Phone size={16}/> رقم الهاتف</span>
                  <span className="adetails-value ltr-fix">+2001155591759</span>
                </div>
                <div className="adetails-item">
                  <span className="adetails-label"><MapPin size={16}/> البلد</span>
                  <span className="adetails-value">الكويت</span>
                </div>
                <div className="adetails-item">
                  <span className="adetails-label"><MapPin size={16}/> المدينة</span>
                  <span className="adetails-value">الكويت</span>
                </div>
                <div className="adetails-item">
                  <span className="adetails-label"><MapPin size={16}/> العنوان</span>
                  <span className="adetails-value">الكويت - شارع القادسية</span>
                </div>
                <div className="adetails-item">
                  <span className="adetails-label"><CheckCircle size={16}/> الحالة</span>
                  <span className="adetails-value status-active">مفعل</span>
                </div>
              </div>
            </div>

            <div className="adetails-divider" />

            {/* Supervisor Section */}
            <div className="adetails-section">
              <h3>بيانات مشرف الجمعية</h3>
              <div className="adetails-grid single">
                <div className="adetails-item">
                  <span className="adetails-label"><User size={16}/> اسم مشرف الجمعية</span>
                  <span className="adetails-value">احمد عاطف</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div className="adetails-stats-grid">
            {mockStats.map((stat) => (
              <StatCard
                key={stat.id}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                iconBgColor={stat.bgColor}
                iconColor={stat.color}
                trend="up"
                trendValue="الشهر الماضي 10.5% ^"
              />
            ))}
          </div>

          {/* ── Charts Row ── */}
          <div className="adetails-charts-grid">
            <div className="adetails-chart-card">
              <div className="adetails-chart-header">
                <h3>توزيع المدعوين بمحافظات الكويت</h3>
              </div>
              <div className="adetails-chart-content map-wrapper">
                <img
                  src="/image 1.png"
                  alt="خريطة الكويت"
                  className="adetails-kuwait-map"
                />
                <div className="adetails-gov-list">
                  {governorates.map((gov, idx) => (
                    <div key={idx} className="adetails-gov-row">
                      <div className="adetails-gov-header">
                        <span className="adetails-gov-name">{gov.name}</span>
                        <span className="adetails-gov-count">{gov.count}</span>
                      </div>
                      <div className="adetails-gov-progress">
                        <div
                          className="adetails-gov-fill"
                          style={{ width: `${gov.percentage}%`, backgroundColor: gov.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="adetails-chart-card">
              <div className="adetails-chart-header">
                <h3>اجمالي الطلبات</h3>
              </div>
              <div className="adetails-chart-content">
                <RequestsChart />
              </div>
            </div>
            <div className="adetails-chart-card">
              <div className="adetails-chart-header row-between">
                <h3>من اسلموا / رفضوا</h3>
                <select className="adetails-chart-select">
                  <option>اشهر</option>
                </select>
              </div>
              <div className="adetails-chart-content">
                <ConversionsChart />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Preachers */}
      {activeTab === 'preachers' && (
        <div className="adetails-content">
          <div className="adetails-preachers-controls">
            <div className="adetails-search-box">
              <input 
                type="text" 
                placeholder="ابحث"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={18} color="#9CA3AF" />
            </div>
            <button className="adetails-filter-btn">
              <span>فلتر</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            </button>
            <button className="adetails-sort-btn">
              <span>تصنيف</span>
              <Filter size={18} />
            </button>
          </div>

          <div className="adetails-table-container">
            <table className="adetails-table">
              <thead>
                <tr>
                  <th>رقم <ChevronDown size={14} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: 4, cursor: 'pointer', color: '#9CA3AF'}} /></th>
                  <th>اسم الداعية <ChevronDown size={14} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: 4, cursor: 'pointer', color: '#9CA3AF'}} /></th>
                  <th>الجنسية <ChevronDown size={14} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: 4, cursor: 'pointer', color: '#9CA3AF'}} /></th>
                  <th>تاريخ الانضمام <ChevronDown size={14} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: 4, cursor: 'pointer', color: '#9CA3AF'}} /></th>
                  <th>اللغة <ChevronDown size={14} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: 4, cursor: 'pointer', color: '#9CA3AF'}} /></th>
                  <th>مفعل / غير مفعل <ChevronDown size={14} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: 4, cursor: 'pointer', color: '#9CA3AF'}} /></th>
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
                    <td>
                      <div className="adetails-table-actions">
                        <button 
                          className="adetails-icon-btn view-btn"
                          onClick={() => navigate(`/admin/associations/${id}/preachers/${preacher.id}`)}
                        ><Eye size={18}/></button>
                        <button 
                          className="adetails-icon-btn delete-btn"
                          onClick={() => setShowDeletePreacherModal(true)}
                        ><Trash2 size={18} color="#EF4444" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="aadmin-modal-overlay">
          <div className="aadmin-delete-modal">
            <button 
              className="aadmin-modal-close" 
              onClick={() => setShowDeleteModal(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="aadmin-delete-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <h2 className="aadmin-delete-title">حذف الجمعية</h2>
            <p className="aadmin-delete-text">هل تود ان تتخذ هذا الاجراء ؟</p>
            <div className="aadmin-delete-actions">
              <button 
                className="aadmin-btn-cancel"
                onClick={() => setShowDeleteModal(false)}
              >الالغاء</button>
              <button 
                className="aadmin-btn-confirm"
                onClick={confirmDelete}
              >تأكيد</button>
            </div>
          </div>
        </div>
      )}
      {/* ── Delete Preacher Modal ── */}
      {showDeletePreacherModal && (
        <div className="aadmin-modal-overlay">
          <div className="aadmin-delete-modal">
            <button 
              className="aadmin-modal-close" 
              onClick={() => setShowDeletePreacherModal(false)}
            >
              <X size={20} />
            </button>
            <div className="aadmin-delete-icon">
              <X size={32} color="#fff" strokeWidth={2.5} />
            </div>
            <h2 className="aadmin-delete-title">حذف الداعية</h2>
            <p className="aadmin-delete-text">هل تود ان تتخذ هذا الاجراء ؟</p>
            <div className="aadmin-delete-actions">
              <button 
                className="aadmin-btn-cancel"
                onClick={() => setShowDeletePreacherModal(false)}
              >الغاء</button>
              <button 
                className="aadmin-btn-confirm"
                onClick={confirmDeletePreacher}
              >تأكيد</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssociationDetails;
