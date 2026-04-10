import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Calendar, Eye, EyeOff, Check, X, Upload, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import api from '../../services/api';
import './AdminAddAssociation.css';

interface Country {
  id: number;
  name: string;
}

const AdminAddAssociation = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showStatusModal, setShowStatusModal] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    organization_name: '',
    manager_name: '',
    license_number: '',
    country_id: '',
    email: '',
    phone: '',
    governorate: '',
    establishment_date: '',
    password: '',
    password_confirm: ''
  });
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Custom UI States
  const [countries, setCountries] = useState<Country[]>([]);
  const [showCountries, setShowCountries] = useState(false);
  const [showGovernorates, setShowGovernorates] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Search state for countries
  const [countrySearch, setCountrySearch] = useState('');

  // Calendar Logic State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Refs for click outside
  const countryRef = useRef<HTMLDivElement>(null);
  const govRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Governorates List
  const governorates = [
    { id: 'jahra', name: 'محافظة الجهراء' },
    { id: 'asima', name: 'محافظة العاصمة' },
    { id: 'farwaniya', name: 'محافظة الفروانية' },
    { id: 'hawalli', name: 'محافظة حولي' },
    { id: 'mubarak_al_kabeer', name: 'محافظة مبارك الكبير' },
    { id: 'ahmadi', name: 'محافظة الأحمدي' },
    { id: 'other', name: 'أخرى' }
  ];

  // Handle Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) setShowCountries(false);
      if (govRef.current && !govRef.current.contains(event.target as Node)) setShowGovernorates(false);
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setShowCalendar(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await api.get('/preachers/countries');
        setCountries(res.data.data || []);
      } catch (err) {
        console.error('Error fetching countries:', err);
      }
    };
    fetchCountries();
  }, []);

  // Calendar Helpers
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const handleMonthNav = (direction: 'next' | 'prev') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'next') newDate.setMonth(prev.getMonth() + 1);
      else newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const selectDate = (day: number) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Format YYYY-MM-DD for backend
    const formatted = selectedDate.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, establishment_date: formatted }));
    setShowCalendar(false);
  };

  // Derived Values
  const selectedCountry = countries.find(c => String(c.id) === formData.country_id);
  const selectedGov = governorates.find(g => g.id === formData.governorate);
  const filteredCountries = countries.filter(c => c.name.includes(countrySearch));


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLicenseFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (loading) return;
    
    // Basic validation
    if (formData.password !== formData.password_confirm) {
      setErrorMessage('كلمتا المرور غير متطابقتين');
      setShowStatusModal('error');
      return;
    }

    if (!licenseFile) {
      setErrorMessage('يرجى ارفاق ملف الترخيص');
      setShowStatusModal('error');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      // Backend expects 'org_email' for the organization profile and 'email' for the user account
      // In this UI, they are the same
      data.append('org_email', formData.email);
      data.append('license_file', licenseFile);

      await api.post('/organizations/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setShowStatusModal('success');
    } catch (err: unknown) {
      const error = err as any; 
      console.error('Error registering organization:', error);
      const detail = error.response?.data?.detail;
      setErrorMessage(Array.isArray(detail) ? detail[0]?.msg : detail || 'حدث خطأ في التسجيل');
      setShowStatusModal('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aadd-page">
      {/* ── Breadcrumb & Title ── */}
      <div className="aadd-header">
        <div className="aadd-breadcrumb">
          <span 
            className="aadd-crumb-link" 
            onClick={() => navigate('/admin/associations')}
          >الجمعيات</span>
          <span className="aadd-crumb-separator">{'<'}</span>
          <span className="aadd-crumb-current">اضافة جمعية جديدة</span>
        </div>
        <h1 className="aadd-title">اضافة جمعية جديدة</h1>
      </div>

      {/* ── Form Card ── */}
      <div className="aadd-card">
        <div className="aadd-grid">
          {/* Row 1 */}
          <div className="aadd-group">
            <label className="aadd-label">اسم الجمعية</label>
            <input 
              type="text" 
              name="organization_name"
              value={formData.organization_name}
              onChange={handleChange}
              className="aadd-input" 
              placeholder="اسم الجمعية" 
            />
          </div>
          <div className="aadd-group">
            <label className="aadd-label">اسم مشرف الجمعية</label>
            <input 
              type="text" 
              name="manager_name"
              value={formData.manager_name}
              onChange={handleChange}
              className="aadd-input" 
              placeholder="اسم مشرف الجمعية" 
            />
          </div>

          {/* Row 2 */}
          <div className="aadd-group">
            <label className="aadd-label">رقم السجل / الترخيص</label>
            <input 
              type="text" 
              name="license_number"
              value={formData.license_number}
              onChange={handleChange}
              className="aadd-input" 
              placeholder="رقم السجل / الترخيص" 
            />
          </div>
          <div className="aadd-group" ref={countryRef}>
            <label className="aadd-label">الدولة</label>
            <div className="aadd-custom-select" onClick={() => setShowCountries(!showCountries)}>
              <span>{selectedCountry ? selectedCountry.name : 'الدولة'}</span>
              <ChevronDown className={`aadd-select-icon ${showCountries ? 'rotate' : ''}`} size={18} />
            </div>
            
            {showCountries && (
              <div className="aadd-dropdown-menu">
                <div className="aadd-dropdown-search">
                  <Search size={14} />
                  <input 
                    type="text" 
                    placeholder="ابحث عن دولة..." 
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="aadd-dropdown-list">
                  {filteredCountries.map(country => (
                    <div 
                      key={country.id} 
                      className={`aadd-dropdown-item ${formData.country_id === String(country.id) ? 'selected' : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, country_id: String(country.id) }));
                        setShowCountries(false);
                      }}
                    >
                      {country.name}
                      {formData.country_id === String(country.id) && <Check size={14} />}
                    </div>
                  ))}
                  {filteredCountries.length === 0 && <div className="aadd-dropdown-empty">لا توجد نتائج</div>}
                </div>
              </div>
            )}
          </div>

          {/* Row 3 */}
          <div className="aadd-group">
            <label className="aadd-label">البريد الالكتروني</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="aadd-input" 
              placeholder="البريد الالكتروني" 
            />
          </div>
          <div className="aadd-group">
            <label className="aadd-label">رقم الهاتف الخاص بالجمعية</label>
            <input 
              type="text" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="aadd-input" 
              placeholder="رقم الهاتف الخاص بالجمعية" 
            />
          </div>

          {/* Row 4 */}
          <div className="aadd-group" ref={govRef}>
            <label className="aadd-label">المحافظة</label>
            <div className="aadd-custom-select" onClick={() => setShowGovernorates(!showGovernorates)}>
              <span>{selectedGov ? selectedGov.name : 'المحافظة'}</span>
              <ChevronDown className={`aadd-select-icon ${showGovernorates ? 'rotate' : ''}`} size={18} />
            </div>

            {showGovernorates && (
              <div className="aadd-dropdown-menu">
                <div className="aadd-dropdown-list">
                  {governorates.map(gov => (
                    <div 
                      key={gov.id} 
                      className={`aadd-dropdown-item ${formData.governorate === gov.id ? 'selected' : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, governorate: gov.id }));
                        setShowGovernorates(false);
                      }}
                    >
                      {gov.name}
                      {formData.governorate === gov.id && <Check size={14} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="aadd-group" ref={calendarRef}>
            <label className="aadd-label">تاريخ تأسيس الجمعية</label>
            <div className="aadd-custom-select" onClick={() => setShowCalendar(!showCalendar)}>
              <Calendar size={18} className="aadd-field-icon" />
              <span>{formData.establishment_date || 'تاريخ تأسيس الجمعية'}</span>
              <ChevronDown className={`aadd-select-icon ${showCalendar ? 'rotate' : ''}`} size={18} />
            </div>

            {showCalendar && (
              <div className="aadd-calendar-popup">
                <div className="aadd-cal-header">
                  <button onClick={() => handleMonthNav('prev')}><ChevronRight size={20} /></button>
                  <span className="aadd-cal-month">
                    {currentDate.toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => handleMonthNav('next')}><ChevronLeft size={20} /></button>
                </div>
                
                <div className="aadd-cal-days-header">
                  {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(d => <span key={d}>{d}</span>)}
                </div>
                
                <div className="aadd-cal-grid">
                  {Array.from({ length: firstDayOfMonth(currentDate.getMonth(), currentDate.getFullYear()) }).map((_, i) => (
                    <div key={`empty-${i}`} className="aadd-cal-day empty" />
                  ))}
                  {Array.from({ length: daysInMonth(currentDate.getMonth(), currentDate.getFullYear()) }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = formData.establishment_date === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    return (
                      <div 
                        key={day} 
                        className={`aadd-cal-day ${isSelected ? 'selected' : ''}`}
                        onClick={() => selectDate(day)}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Row 5 - License File Upload */}
          <div className="aadd-group">
            <label className="aadd-label">ملف الترخيص (PDF/صورة)</label>
            <div 
              className={`aadd-file-upload ${licenseFile ? 'active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} />
              <span>{licenseFile ? licenseFile.name : 'ارفع ملف الترخيص'}</span>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".pdf,image/*"
              />
            </div>
          </div>

          <div className="aadd-group" /> {/* Spacer */}

          {/* Row 6 */}
          <div className="aadd-group">
            <label className="aadd-label">كلمة السر (يجب أن تحتوي على حرف كبير واحد على الأقل)</label>
            <div className="aadd-input-with-icon left">
              <div onClick={() => setShowPassword(!showPassword)} style={{cursor: 'pointer'}}>
                {showPassword ? <EyeOff className="aadd-icon-left" size={18} /> : <Eye className="aadd-icon-left" size={18} />}
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="aadd-input" 
                placeholder="كلمة السر" 
              />
            </div>
          </div>
          <div className="aadd-group">
            <label className="aadd-label">تأكيد كلمة السر</label>
            <div className="aadd-input-with-icon left">
              <div onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{cursor: 'pointer'}}>
                {showConfirmPassword ? <EyeOff className="aadd-icon-left" size={18} /> : <Eye className="aadd-icon-left" size={18} />}
              </div>
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                className="aadd-input" 
                placeholder="تأكيد كلمة السر" 
              />
            </div>
          </div>
        </div>

        {/* ── Action ── */}
        <div className="aadd-actions">
          <button 
            className="aadd-save-btn" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'حفظ'}
          </button>
        </div>
      </div>

      {/* ── Status Modals ── */}
      {showStatusModal === 'success' && (
        <div className="aadd-modal-overlay">
          <div className="aadd-status-modal">
            <button className="aadd-modal-close" onClick={() => setShowStatusModal(null)}>
               <X size={20} />
            </button>
            <div className="aadd-status-icon success">
              <Check size={40} strokeWidth={3} />
            </div>
            <h2 className="aadd-status-title">تم بنجاح!</h2>
            <p className="aadd-status-desc">لقد تم اضافة الجمعية بنجاح</p>
            <button 
              className="aadd-status-btn success" 
              onClick={() => navigate('/admin/associations')}
            >
              تم
            </button>
          </div>
        </div>
      )}

      {showStatusModal === 'error' && (
        <div className="aadd-modal-overlay">
          <div className="aadd-status-modal">
            <button className="aadd-modal-close" onClick={() => setShowStatusModal(null)}>
               <X size={20} />
            </button>
            <div className="aadd-status-icon error">
              <X size={40} strokeWidth={3} />
            </div>
            <h2 className="aadd-status-title">حدث خطأ!</h2>
            <p className="aadd-status-desc">{errorMessage || 'لم يتم اضافة الجمعية بنجاح'}</p>
            <button className="aadd-status-btn error" onClick={() => setShowStatusModal(null)}>
              حاول مرة اخري
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminAddAssociation;
