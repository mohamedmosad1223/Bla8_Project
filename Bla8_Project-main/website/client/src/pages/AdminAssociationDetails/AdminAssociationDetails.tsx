import { useState, useEffect, useCallback, useRef } from 'react';
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
  Eye,
  Search,
  Filter,
  X,
  MessageCircle,
  Loader2
} from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import RequestsChart from '../../components/RequestsChart/RequestsChart';
import ConversionsChart from '../../components/ConversionsChart/ConversionsChart';
import WorldMap from '../../components/WorldMap/WorldMap';
import api from '../../services/api';
import ErrorModal from '../../components/common/Modal/ErrorModal';
import SuccessModal from '../../components/common/Modal/SuccessModal';
import './AdminAssociationDetails.css';

const governoratesList = [
  { label: 'مصر', value: 1 },
  { label: 'السعودية', value: 1 },
  { label: 'الإمارات', value: 1 },
  { label: 'الأردن', value: 1 },
  { label: 'الولايات المتحدة', value: 1 },
  { label: 'بريطانيا', value: 1 },
];

const AdminAssociationDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'data' | 'preachers'>('data');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletePreacherModal, setShowDeletePreacherModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Error Modal State
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'latest'|'oldest'>('latest');
  const [granularity, setGranularity] = useState<'day' | 'month'>('month');

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const [orgData, setOrgData] = useState<any>(null);
  const [preachers, setPreachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/organizations/${id}`, {
        params: { trend_granularity: granularity }
      });
      setOrgData(res.data.data);
      
      const preachersRes = await api.get('/preachers/', {
        params: { org_id: id }
      });
      setPreachers(preachersRes.data.data);
    } catch (err) {
      console.error('Error fetching association details:', err);
    } finally {
      setLoading(false);
    }
  }, [id, granularity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const confirmDelete = async () => {
    try {
      await api.delete(`/organizations/${id}`);
      setShowDeleteModal(false);
      navigate('/admin/associations');
    } catch (err: any) {
      console.error('Error deleting organization:', err);
      setErrorMessage(err.response?.data?.detail || 'تعذر حذف الجمعية');
      setIsErrorModalOpen(true);
    }
  };

  const handleDeletePreacherClick = (preacherId: number) => {
    setItemToDelete(preacherId);
    setShowDeletePreacherModal(true);
  };

  const confirmDeletePreacher = async () => {
    if (itemToDelete) {
      try {
        await api.delete(`/preachers/${itemToDelete}`);
        fetchData();
      } catch (err: any) {
        console.error('Error deleting preacher:', err);
        setErrorMessage(err.response?.data?.detail || 'تعذر حذف الداعية');
        setIsErrorModalOpen(true);
      }
    }
    setShowDeletePreacherModal(false);
    setItemToDelete(null);
  };

  const togglePreacherActive = async (preacherId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      
      const response = await api.patch(`/admins/management/preachers/${preacherId}/status`, { 
        status: newStatus 
      });
      
      setSuccessMessage(response.data.message || 'تم تحديث حالة الداعية بنجاح');
      setIsSuccessModalOpen(true);
      fetchData();
    } catch (err: any) {
      console.error('Error toggling preacher status:', err);
      setErrorMessage(err.response?.data?.detail || 'تعذر تحديث حالة الداعية');
      setIsErrorModalOpen(true);
    }
  };

  const getGovernorateName = (id: string) => {
    const govs = [
      { id: 'jahra', name: 'محافظة الجهراء' },
      { id: 'asima', name: 'محافظة العاصمة' },
      { id: 'farwaniya', name: 'محافظة الفروانية' },
      { id: 'hawalli', name: 'محافظة حولي' },
      { id: 'mubarak_al_kabeer', name: 'محافظة مبارك الكبير' },
      { id: 'ahmadi', name: 'محافظة الأحمدي' },
      { id: 'other', name: 'أخرى' },
    ];
    return govs.find(g => g.id === id)?.name || id;
  };

  if (loading && !orgData) {
    return (
      <div className="aadmin-loading-state">
        <Loader2 className="animate-spin" size={48} color="#DBA841" />
        <p>جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (!orgData) return null;

  const stats = [
    { id: 1, title: 'اجمالي عدد الدعاة',          value: orgData.preachers_count,  icon: <Users size={24} />,        bgColor: '#F3E8FF', color: '#A855F7' },
    { id: 2, title: 'اجمالي عدد طلبات الجمعية',   value: orgData.cases_count,      icon: <FileText size={24} />,     bgColor: '#FEF3C7', color: '#F59E0B' },
    { id: 3, title: 'من اسلموا',                   value: orgData.converted_count,  icon: <UserCheck size={24} />,    bgColor: '#D1FAE5', color: '#10B981' },
    { id: 4, title: 'من رفضوا',                    value: orgData.rejected_count,   icon: <FileText size={24} />,     bgColor: '#FEE2E2', color: '#EF4444' },
  ];

  const filteredPreachers = preachers.filter(p => {
    if (searchQuery && !p.full_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortBy === 'latest' ? timeB - timeA : timeA - timeB;
  });

  const nationalityStyles = [
    { fill: '#FF4D4F', bg: '#FFF1F0' },
    { fill: '#1890FF', bg: '#E6F7FF' },
    { fill: '#FFA940', bg: '#FFF7E6' },
    { fill: '#722ED1', bg: '#F9F0FF' },
    { fill: '#13C2C2', bg: '#E6FFFB' },
    { fill: '#52C41A', bg: '#F6FFED' },
  ];

  const distributionData: Array<{ label: string; value: number }> =
    (orgData.governorates_distribution || governoratesList).map((item: any) => ({
      label: item.label || item.name || 'غير محدد',
      value: Number(item.value) || 0,
    }));

  const totalDistributionValue = distributionData.reduce((sum, item) => sum + item.value, 0);

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
                    className="adetails-icon-btn chat-btn" 
                    title="محادثة"
                    onClick={() => navigate(`/admin/chat/${orgData.user_id}`)}
                    style={{ color: '#dba841' }}
                  >
                    <MessageCircle size={18} />
                  </button>
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
                  <span className="adetails-value">{orgData.organization_name}</span>
                </div>
                <div className="adetails-item">
                  <span className="adetails-label"><FileText size={16}/> رقم الترخيص</span>
                  <span className="adetails-value ltr-fix">{orgData.license_number}</span>
                </div>
                <div className="adetails-item">
                  <span className="adetails-label"><Mail size={16}/> البريد الالكتروني</span>
                  <span className="adetails-value ltr-fix">{orgData.email}</span>
                </div>
                <div className="adetails-item">
                  <span className="adetails-label"><Phone size={16}/> رقم الهاتف</span>
                  <span className="adetails-value ltr-fix">{orgData.phone}</span>
                </div>
                <div className="adetails-item">
                  <span className="adetails-label"><MapPin size={16}/> البلد</span>
                  <span className="adetails-value">{orgData.country_name}</span>
                </div>
                <div className="adetails-item">
                  <span className="adetails-label"><MapPin size={16}/> المحافظة</span>
                  <span className="adetails-value">{getGovernorateName(orgData.governorate)}</span>
                </div>
                <div className="adetails-item">
                  <span className="adetails-label"><CheckCircle size={16}/> الحالة</span>
                  <span className={`adetails-value ${orgData.account_status === 'active' ? 'status-active' : 'status-inactive'}`}>
                    {orgData.account_status === 'active' ? 'مفعل' : 'معطل'}
                  </span>
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
                  <span className="adetails-value">{orgData.manager_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div className="adetails-stats-grid">
            {stats.map((stat) => (
              <StatCard
                key={stat.id}
                title={stat.title}
                value={stat.value?.toString() || '0'}
                icon={stat.icon}
                iconBgColor={stat.bgColor}
                iconColor={stat.color}
                trend="up"
                trendValue="الشهر الماضي 0% ^"
              />
            ))}
          </div>

          {/* ── Charts Row ── */}
          <div className="adetails-charts-grid">
            <div className="adetails-chart-card">
              <div className="adetails-chart-header">
                <h3>توزيع المدعوين</h3>
              </div>
              <div className="adetails-chart-content map-wrapper">
                <WorldMap data={distributionData} colors={nationalityStyles.map((s) => s.fill)} />
                <div className="adetails-gov-list">
                  {distributionData.map((gov, idx: number) => {
                    const style = nationalityStyles[idx % nationalityStyles.length];
                    const percentage = totalDistributionValue > 0
                      ? (gov.value / totalDistributionValue) * 100
                      : 0;

                    return (
                      <div key={idx} className="adetails-gov-row">
                        <div className="adetails-gov-header">
                          <span className="adetails-gov-name">{gov.label}</span>
                          <span className="adetails-gov-count">{gov.value} شخص</span>
                        </div>
                        <div className="adetails-gov-progress">
                          <div
                            className="adetails-gov-fill"
                            style={{ 
                              width: `${Math.min(100, percentage)}%`,
                              backgroundColor: style.fill
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="adetails-chart-card">
              <div className="adetails-chart-header">
                <h3>اجمالي الطلبات</h3>
              </div>
              <div className="adetails-chart-content">
                <RequestsChart data={orgData.requests_distribution} />
              </div>
            </div>
            <div className="adetails-chart-card">
              <div className="adetails-chart-header row-between">
                <h3>من اسلموا / رفضوا</h3>
                <div className="granularity-toggle">
                  <button
                    className={granularity === 'day' ? 'active' : ''}
                    onClick={() => setGranularity('day')}
                  >
                    يومي
                  </button>
                  <button
                    className={granularity === 'month' ? 'active' : ''}
                    onClick={() => setGranularity('month')}
                  >
                    شهري
                  </button>
                </div>
              </div>
              <div className="adetails-chart-content">
                <ConversionsChart data={orgData.conversion_trends} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Preachers */}
      {activeTab === 'preachers' && (
        <div className="adetails-content">
          <div className="admin-toolbar left-aligned">
            <div className="admin-toolbar-group">
              <div className="admin-search-box">
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="ابحث"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="admin-dropdown-container" ref={filterRef}>
                <button 
                  className={`admin-tool-btn ${isFilterOpen ? 'active' : ''}`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <FilterIcon size={18} />
                  <span>فلتر</span>
                </button>
                {isFilterOpen && (
                  <div className="admin-dropdown-menu">
                    <div style={{fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '4px', fontSize: '0.85rem'}}>حالة الداعية</div>
                    <label className="admin-dropdown-item" style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                      <input type="radio" name="status" checked={filterStatus === 'all'} onChange={() => {setFilterStatus('all'); setIsFilterOpen(false);}} />
                      الكل
                    </label>
                    <label className="admin-dropdown-item" style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                      <input type="radio" name="status" checked={filterStatus === 'active'} onChange={() => {setFilterStatus('active'); setIsFilterOpen(false);}} />
                      مفعل
                    </label>
                    <label className="admin-dropdown-item" style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                      <input type="radio" name="status" checked={filterStatus === 'suspended'} onChange={() => {setFilterStatus('suspended'); setIsFilterOpen(false);}} />
                      غير مفعل
                    </label>
                  </div>
                )}
              </div>

              <div className="admin-dropdown-container" ref={sortRef}>
                <button 
                  className={`admin-tool-btn ${isSortOpen ? 'active' : ''}`}
                  onClick={() => setIsSortOpen(!isSortOpen)}
                >
                  <Filter size={18} />
                  <span>تصنيف: {sortBy === 'latest' ? 'الأحدث' : 'الأقدم'}</span>
                </button>
                {isSortOpen && (
                  <div className="admin-dropdown-menu" style={{left: 0, right: 'auto'}}>
                    <button 
                      className={`admin-dropdown-item ${sortBy === 'latest' ? 'selected' : ''}`}
                      onClick={() => {setSortBy('latest'); setIsSortOpen(false);}}
                    >الأحدث</button>
                    <button 
                      className={`admin-dropdown-item ${sortBy === 'oldest' ? 'selected' : ''}`}
                      onClick={() => {setSortBy('oldest'); setIsSortOpen(false);}}
                    >الأقدم</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="adetails-table-container">
            <table className="adetails-table">
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
                {filteredPreachers.map((preacher) => (
                  <tr key={preacher.preacher_id}>
                    <td>{preacher.preacher_id}</td>
                    <td>{preacher.full_name}</td>
                    <td>{preacher.nationality_name}</td>
                    <td className="multiline-cell">
                      {new Date(preacher.created_at).toLocaleDateString('ar-EG')}
                      <br/>
                      {new Date(preacher.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td>{preacher.language_names.join(', ')}</td>
                    <td>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={preacher.status === 'active'} 
                          onChange={() => togglePreacherActive(preacher.preacher_id, preacher.status)}
                        />
                        <span className="slider round"></span>
                      </label>
                    </td>
                    <td>
                      <div className="adetails-table-actions">
                        <button 
                          className="adetails-icon-btn view-btn"
                          title="عرض"
                          onClick={() => navigate(`/admin/associations/${id}/preachers/${preacher.preacher_id}`)}
                        >
                          <Eye size={18}/>
                        </button>
                        <button 
                          className="adetails-icon-btn chat-btn"
                          title="محادثة"
                          onClick={() => navigate(`/admin/chat/${preacher.user_id}`)}
                          style={{ color: '#dba841', marginRight: '8px' }}
                        >
                          <MessageCircle size={18}/>
                        </button>
                        <button 
                          className="adetails-icon-btn delete-btn"
                          title="حذف"
                          onClick={() => handleDeletePreacherClick(preacher.preacher_id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && preachers.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                      لا يوجد دعاة مسجلين لهذه الجمعية حالياً
                    </td>
                  </tr>
                )}
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
              <X size={20} />
            </button>
            <div className="aadmin-delete-icon">
              <Trash2 size={32} color="#fff" />
            </div>
            <h2 className="aadmin-delete-title">حذف الجمعية</h2>
            <p className="aadmin-delete-text">هل تود ان تتخذ هذا الاجراء ؟ سيتم حذف جميع بيانات الجمعية بشكل نهائي.</p>
            <div className="aadmin-delete-actions">
              <button 
                className="aadmin-btn-cancel"
                onClick={() => setShowDeleteModal(false)}
              >الالغاء</button>
              <button 
                className="aadmin-btn-confirm"
                onClick={confirmDelete}
              >تأكيد الحذف</button>
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
              <Trash2 size={32} color="#fff" />
            </div>
            <h2 className="aadmin-delete-title">حذف الداعية</h2>
            <p className="aadmin-delete-text">هل تود ان تتخذ هذا الاجراء ؟ سيتم حذف جميع بيانات الداعية بشكل نهائي.</p>
            <div className="aadmin-delete-actions">
              <button 
                className="aadmin-btn-cancel"
                onClick={() => setShowDeletePreacherModal(false)}
              >الغاء</button>
              <button 
                className="aadmin-btn-confirm"
                onClick={confirmDeletePreacher}
              >تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}

      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        message={errorMessage}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="تم بنجاح"
        description={successMessage}
      />
    </div>
  );
};

export default AdminAssociationDetails;

// Helper to avoid name conflict with Filter (lucide-react)
const FilterIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
);
