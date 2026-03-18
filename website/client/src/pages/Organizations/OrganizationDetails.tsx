import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  Trash2, 
  Edit3, 
  Building2, 
  FileText, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  User, 
  Users, 
  LayoutGrid, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Search,
  Filter as FilterIcon,
  SortDesc,
  Eye,
  X,
  Check
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import WorldMap from '../../components/WorldMap/WorldMap';
import ConfirmModal from '../../components/common/ConfirmModal/ConfirmModal';
import './OrganizationDetails.css';

const OrganizationDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'data' | 'preachers'>('data');

  // Filter & Sort States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [filterLanguages, setFilterLanguages] = useState<string[]>(['الانجليزية', 'الفرنسية']);
  const [selectedStatus, setSelectedStatus] = useState<string>('مفعل');

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreacherDeleteModalOpen, setIsPreacherDeleteModalOpen] = useState(false);
  const [preacherToDelete, setPreacherToDelete] = useState<number | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleAccordion = (name: string) => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  const removeLanguage = (lang: string) => {
    setFilterLanguages(filterLanguages.filter(l => l !== lang));
  };

  const addLanguage = (lang: string) => {
    if (!filterLanguages.includes(lang)) {
      setFilterLanguages([...filterLanguages, lang]);
    }
  };

  const availableLanguages = ['العربية', 'الانجليزية', 'الفرنسية', 'الاسبانية', 'البرتغالية'];


  // Mock data for the organization
  const orgData = {
    id: id || '12345678',
    name: 'جمعية رسالة الاسلام',
    licenseNumber: '12345678',
    email: 'John2025@gmail.com',
    phone: '+2001155591759',
    country: 'الكويت',
    city: 'المدينة هنا',
    address: 'الكويت - شارع القادسية',
    status: 'مفعل',
    supervisor: 'احمد عاطف'
  };

  const stats = [
    { title: 'إجمالي عدد الدعاة', value: 100, trend: '+10.5%', isUp: true, icon: <Users size={20} />, color: 'blue' },
    { title: 'إجمالي عدد طلبات الجمعية', value: 100, trend: '+10.5%', isUp: true, icon: <FileText size={20} />, color: 'gold' },
    { title: 'من اسلموا', value: 100, trend: '+10.5%', isUp: true, icon: <CheckCircle2 size={20} />, color: 'green' },
    { title: 'من رفضوا', value: 100, trend: '-10.5%', isUp: false, icon: <XCircle size={20} />, color: 'red' },
  ];

  // Bar chart data
  const barData = [
    { name: 'يناير', اسلم: 80, رفض: 40 },
    { name: 'فبراير', اسلم: 120, رفض: 60 },
    { name: 'مارس', اسلم: 100, رفض: 70 },
    { name: 'ابريل', اسلم: 110, رفض: 50 },
    { name: 'مايو', اسلم: 130, رفض: 45 },
    { name: 'يونيو', اسلم: 90, رفض: 55 },
    { name: 'يوليو', اسلم: 115, رفض: 35 },
  ];

  // Donut chart data
  const pieData = [
    { name: 'من اسلم', value: 2000, color: '#10B981' },
    { name: 'قيد التنفيذ', value: 1000, color: '#DBA841' },
    { name: 'تم الالغاء', value: 1000, color: '#EF4444' },
  ];

  const nationalities = [
    { country: 'الولايات المتحدة الأمريكية', count: '72 الف شخص', percentage: 70, color: '#EF4444' },
    { country: 'المملكة المتحدة', count: '50 الف شخص', percentage: 50, color: '#3B82F6' },
  ];

  const [preachers, setPreachers] = useState([
    { id: '123456', name: 'جون سميث', nationality: 'فرنسا', joinDate: '22/02/2023\n7:00 AM', language: 'الانجليزية، الفرنسية', status: true },
    { id: '123456', name: 'جون سميث', nationality: 'انجلترا', joinDate: '22/02/2023\n7:00 AM', language: 'الانجليزية، الفرنسية', status: false },
    { id: '123456', name: 'جون سميث', nationality: 'البرتغال', joinDate: '22/02/2023\n7:00 AM', language: 'الانجليزية، الفرنسية', status: true },
    { id: '123456', name: 'جون سميث', nationality: 'المانيا', joinDate: '22/02/2023\n7:00 AM', language: 'الانجليزية، الفرنسية', status: true },
    { id: '123456', name: 'جون سميث', nationality: 'بلجيكا', joinDate: '22/02/2023\n7:00 AM', language: 'الانجليزية، الفرنسية', status: false },
    { id: '123456', name: 'جون سميث', nationality: 'الاتحاد الروسي', joinDate: '22/02/2023\n7:00 AM', language: 'الانجليزية، الفرنسية', status: true },
    { id: '123456', name: 'جون سميث', nationality: 'الاتحاد الروسي', joinDate: '22/02/2023\n7:00 AM', language: 'الانجليزية، الفرنسية', status: false },
    { id: '123456', name: 'جون سميث', nationality: 'الاتحاد الروسي', joinDate: '22/02/2023\n7:00 AM', language: 'الانجليزية، الفرنسية', status: true },
    { id: '123456', name: 'جون سميث', nationality: 'الاتحاد الروسي', joinDate: '22/02/2023\n7:00 AM', language: 'الانجليزية، الفرنسية', status: true },
    { id: '123456', name: 'جون سميث', nationality: 'الاتحاد الروسي', joinDate: '22/02/2023\n7:00 AM', language: 'الانجليزية، الفرنسية', status: false },
    { id: '123456', name: 'جون سميث', nationality: 'الاتحاد الروسي', joinDate: '22/02/2023\n7:00 AM', language: 'الانجليزية، الفرنسية', status: false },
    { id: '123456', name: 'جون سميث', nationality: 'الاتحاد الروسي', joinDate: '22/02/2023\n7:00 AM', language: 'الانجليزية، الفرنسية', status: true },
  ]);

  const togglePreacherStatus = (index: number) => {
    const newPreachers = [...preachers];
    newPreachers[index].status = !newPreachers[index].status;
    setPreachers(newPreachers);
  };

  const handleDeletePreacherClick = (index: number) => {
    setPreacherToDelete(index);
    setIsPreacherDeleteModalOpen(true);
  };

  const confirmDeletePreacher = () => {
    if (preacherToDelete !== null) {
      const newPreachers = [...preachers];
      newPreachers.splice(preacherToDelete, 1);
      setPreachers(newPreachers);
      setIsPreacherDeleteModalOpen(false);
      setPreacherToDelete(null);
    }
  };

  return (
    <div className="org-details-page" dir="rtl">
      {/* Breadcrumbs */}
      <div className="breadcrumb-area">
        <nav className="breadcrumbs">
          <Link to="/organizations">الجمعيات</Link>
          <ChevronLeft size={14} className="breadcrumb-separator" />
          <span className="current-page">عرض تفاصيل الجمعية</span>
        </nav>
        <h1 className="page-title-main">عرض تفاصيل الجمعية</h1>
      </div>

      {/* Tabs Layout */}
      <div className="details-header-tabs">
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

      {activeTab === 'data' && (
        <div className="tab-content animate-fade-in">
          {/* Info Card */}
          <div className="info-card section-card">
            <div className="card-header-actions">
              <button 
                className="action-btn delete"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 size={18} />
              </button>
              <button 
                className="action-btn edit"
                onClick={() => navigate(`/organizations/edit/${orgData.id}`)}
              >
                <Edit3 size={18} />
              </button>
            </div>

            <div className="info-section">
              <h3 className="section-title">بيانات الجمعية</h3>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label"><Building2 size={16} /> اسم الجمعية</div>
                  <div className="info-value">{orgData.name}</div>
                </div>
                <div className="info-item">
                  <div className="info-label"><FileText size={16} /> رقم الترخيص</div>
                  <div className="info-value">{orgData.licenseNumber}</div>
                </div>
                <div className="info-item">
                  <div className="info-label"><Mail size={16} /> البريد الالكتروني</div>
                  <div className="info-value">{orgData.email}</div>
                </div>
                <div className="info-item">
                  <div className="info-label"><Phone size={16} /> رقم الهاتف</div>
                  <div className="info-value">{orgData.phone}</div>
                </div>
                <div className="info-item">
                  <div className="info-label"><Globe size={16} /> البلد</div>
                  <div className="info-value">{orgData.country}</div>
                </div>
                <div className="info-item">
                  <div className="info-label"><MapPin size={16} /> المدينة</div>
                  <div className="info-value">{orgData.city}</div>
                </div>
                <div className="info-item">
                  <div className="info-label"><MapPin size={16} /> العنوان</div>
                  <div className="info-value">{orgData.address}</div>
                </div>
                <div className="info-item">
                  <div className="info-label"><LayoutGrid size={16} /> الحالة</div>
                  <div className="info-value status-active">{orgData.status}</div>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="info-section">
              <h3 className="section-title">بيانات مشرف الجمعية</h3>
              <div className="info-grid single-col">
                <div className="info-item">
                  <div className="info-label"><User size={16} /> اسم مشرف الجمعية</div>
                  <div className="info-value">{orgData.supervisor}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid-row">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-card-mini animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="stat-card-main">
                  <div className="stat-info">
                    <p className="stat-title">{stat.title}</p>
                    <h2 className="stat-number">{stat.value}</h2>
                    <div className={`stat-trend ${stat.isUp ? 'up' : 'down'}`}>
                      {stat.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>الشهر الماضي {stat.trend}</span>
                    </div>
                  </div>
                  <div className={`stat-icon-wrapper ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="charts-grid-row">
            {/* Bar Chart */}
            <div className="chart-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="chart-header">
                <h3 className="chart-title">من اسلموا / رفضوا</h3>
                <div className="chart-filter-select">
                  <span>الشهر</span> <ChevronDown size={14} />
                </div>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="اسلم" fill="#166088" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="رفض" fill="#DBA841" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="chart-legend-custom">
                  <div className="legend-item"><span className="dot blue"></span> تم الاسلام <span>1000</span></div>
                  <div className="legend-item"><span className="dot gold"></span> رفضوا <span>1000</span></div>
                </div>
              </div>
            </div>

            {/* Donut Chart */}
            <div className="chart-card animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <div className="chart-header">
                <h3 className="chart-title">إجمالي الطلبات</h3>
              </div>
              <div className="chart-body donut-container">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={500}
                      animationDuration={1500}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center-text">
                  <span className="total-num">4000</span>
                  <span className="total-label">طلب</span>
                </div>
                <div className="chart-legend-row">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="legend-item-v">
                      <span className="dot" style={{ backgroundColor: item.color }}></span>
                      <span className="name">{item.name}</span>
                      <span className="val">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Nationalities Map/List */}
            <div className="chart-card animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="chart-header">
                <h3 className="chart-title">جنسيات الأشخاص المدعوين</h3>
              </div>
              <div className="chart-body">
                <div className="map-wrapper-contain">
                  <WorldMap />
                </div>
                <div className="nationalities-list">
                  {nationalities.map((item, idx) => (
                    <div key={idx} className="nat-item">
                      <div className="nat-info">
                        <span className="nat-name">{item.country}</span>
                        <span className="nat-num">{item.count}</span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill animate-progress" 
                          style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preachers' && (
        <div className="tab-content animate-fade-in">
          <div className="preachers-tab-actions">
            <div className="search-input-wrapper-outlined mb-0">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="بحث" className="search-input-outlined" />
            </div>
            
            <div className="filter-sort-group">
               <div className="filter-popup-container" ref={filterRef}>
                <button 
                  className={`btn-icon-text ${isFilterOpen ? 'active' : ''}`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <FilterIcon size={18} />
                  فلتر
                </button>

                {isFilterOpen && (
                  <div className="filter-panel" dir="rtl">
                    <div className="filter-panel-header">
                      <h2 className="filter-title">الفلتر</h2>
                      <button className="btn-apply-filter" onClick={() => setIsFilterOpen(false)}>
                        تطبيق الفلتر
                      </button>
                    </div>

                    <div className="filter-body">
                      {/* Search */}
                      <div className="filter-search">
                        <Search size={16} className="filter-search-icon" />
                        <input type="text" placeholder="ابحث ....." className="filter-search-input" />
                      </div>

                      {/* Join Date Accordion */}
                      <div className="filter-accordion">
                        <div 
                          className="filter-accordion-header"
                          onClick={() => toggleAccordion('date')}
                        >
                          <span>تاريخ الانضمام</span>
                          <ChevronDown 
                            size={16} 
                            className={`text-gray transition-transform ${openAccordion === 'date' ? 'rotate-180' : ''}`} 
                          />
                        </div>
                        {openAccordion === 'date' && (
                          <div className="filter-accordion-content mt-2">
                            <div className="filter-date-input active-outline relative-date-input">
                              <input 
                                type="date"
                                className="custom-date-picker"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Language Accordion */}
                      <div className="filter-accordion">
                        <div 
                          className="filter-accordion-header"
                          onClick={() => toggleAccordion('language')}
                        >
                          <span>اللغة</span>
                          <ChevronDown 
                            size={16} 
                            className={`text-gray transition-transform ${openAccordion === 'language' ? 'rotate-180' : ''}`} 
                          />
                        </div>
                        
                        <div className="filter-accordion-content mt-2">
                          <div className="filter-tags-wrapper">
                            {filterLanguages.map((lang, index) => (
                              <span key={index} className="filter-tag">
                                <span>{lang}</span>
                                <button type="button" onClick={() => removeLanguage(lang)}>
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>

                          {openAccordion === 'language' && (
                             <div className="filter-submenu-list bordered-list mt-3">
                               {availableLanguages.map((lang) => {
                                 const isSelected = filterLanguages.includes(lang);
                                 return (
                                    <label key={lang} className="submenu-item" onClick={(e) => {
                                      e.preventDefault();
                                      if (isSelected) {
                                        removeLanguage(lang);
                                      } else {
                                        addLanguage(lang);
                                      }
                                    }}>
                                      <div className={`checkbox-custom check-align-left ${isSelected ? 'checked-gold' : ''}`}>
                                        {isSelected && <Check size={12} strokeWidth={3} color="white" />}
                                      </div>
                                      <span>{lang}</span>
                                    </label>
                                 );
                               })}
                             </div>
                          )}
                        </div>
                      </div>

                      {/* Status Accordion */}
                      <div className="filter-accordion no-border">
                        <div className="filter-accordion-header filter-status-header" onClick={() => toggleAccordion('status')}>
                          <span>الحالة</span>
                          <ChevronDown 
                            size={16} 
                            className={`text-gray transition-transform ${openAccordion === 'status' ? 'rotate-180' : ''}`} 
                          />
                        </div>
                        {openAccordion === 'status' && (
                          <div className="filter-accordion-content status-content mt-2">
                            <label 
                              className={`status-option ${selectedStatus === 'مفعل' ? 'active-status' : ''}`}
                              onClick={() => setSelectedStatus('مفعل')}
                            >
                              <div className={`checkbox-custom check-align-left ${selectedStatus === 'مفعل' ? 'checked-gold' : ''}`}>
                                  {selectedStatus === 'مفعل' && <Check size={12} strokeWidth={3} color="white" />}
                              </div>
                              <span>مفعل</span>
                            </label>
                            <label 
                              className={`status-option ${selectedStatus === 'غير مفعل' ? 'inactive-status' : ''}`}
                              onClick={() => setSelectedStatus('غير مفعل')}
                            >
                              <div className={`checkbox-custom check-align-left ${selectedStatus === 'غير مفعل' ? 'checked-gold' : ''}`}>
                                   {selectedStatus === 'غير مفعل' && <Check size={12} strokeWidth={3} color="white" />}
                              </div>
                              <span>غير مفعل</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
               </div>

               <div className="sort-container" ref={sortRef}>
                <button 
                  className={`btn-icon-text ${isSortOpen ? 'active' : ''}`}
                  onClick={() => setIsSortOpen(!isSortOpen)}
                >
                  <SortDesc size={18} />
                  تصنيف
                </button>
                {isSortOpen && (
                  <div className="sort-dropdown">
                    <div className="sort-dropdown-title">تصنيف</div>
                    <button className="sort-option">الاحدث</button>
                    <button className="sort-option">الأقدم</button>
                  </div>
                )}
               </div>
            </div>
          </div>

          <div className="table-responsive mt-4">
            <table className="org-table">
              <thead>
                <tr>
                  <th>رقم <span className="sort-arrow">↕</span></th>
                  <th>اسم الداعية <span className="sort-arrow">↕</span></th>
                  <th>الجنسية <span className="sort-arrow">↕</span></th>
                  <th>تاريخ الانضمام <span className="sort-arrow">↕</span></th>
                  <th>اللغة <span className="sort-arrow">↕</span></th>
                  <th>مفعل / غير مفعل <span className="sort-arrow">↕</span></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {preachers.map((preacher, idx) => (
                  <tr key={idx}>
                    <td>{preacher.id}</td>
                    <td className="org-name-cell">{preacher.name}</td>
                    <td>{preacher.nationality}</td>
                    <td className="date-cell">{preacher.joinDate}</td>
                    <td>{preacher.language}</td>
                    <td>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={preacher.status} 
                          onChange={() => togglePreacherStatus(idx)} 
                        />
                        <span className="slider round"></span>
                      </label>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="action-icon-btn delete"
                        onClick={() => handleDeletePreacherClick(idx)}
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        className="action-icon-btn view"
                        onClick={() => navigate(`/preachers/${preacher.id}`)}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Confirmation Modal for Organization */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          console.log('Deleting organization:', orgData.id);
          setIsDeleteModalOpen(false);
          navigate('/organizations');
        }}
        title="حذف الجمعية"
        message="هل تود أن تتخذ هذا الاجراء ؟"
        confirmLabel="تأكيد"
        cancelLabel="الغاء"
      />

      {/* Confirmation Modal for Preacher */}
      <ConfirmModal 
        isOpen={isPreacherDeleteModalOpen}
        onClose={() => setIsPreacherDeleteModalOpen(false)}
        onConfirm={confirmDeletePreacher}
        title="حذف الداعية"
        message="هل تود أن تتخذ هذا الاجراء ؟"
        confirmLabel="تأكيد"
        cancelLabel="الغاء"
      />

      {/* Footer Branding */}
      <div className="pixel-perfect-footer">v4.1.4 Pixel Perfect</div>
    </div>
  );
};

export default OrganizationDetails;
