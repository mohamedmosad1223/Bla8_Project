import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Calendar, Eye, EyeOff, Check, X, Upload, Loader2 } from 'lucide-react';
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
  const [countries, setCountries] = useState<Country[]>([]);
  
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

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get('/preachers/countries');
        setCountries(response.data.data);
      } catch (err) {
        console.error('Error fetching countries:', err);
      }
    };
    fetchCountries();
  }, []);

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
    } catch (err: any) {
      console.error('Error registering organization:', err);
      const detail = err.response?.data?.detail;
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
          <div className="aadd-group">
            <label className="aadd-label">الدولة</label>
            <div className="aadd-select-wrapper">
              <select 
                name="country_id"
                value={formData.country_id}
                onChange={handleChange}
                className="aadd-input aadd-select"
              >
                <option value="">الدولة</option>
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="aadd-select-icon" size={18} />
            </div>
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
          <div className="aadd-group">
            <label className="aadd-label">عنوان الجمعية (المحافظة/الشارع)</label>
            <input 
              type="text" 
              name="governorate"
              value={formData.governorate}
              onChange={handleChange}
              className="aadd-input" 
              placeholder="عنوان الجمعية" 
            />
          </div>
          <div className="aadd-group">
            <label className="aadd-label">تاريخ تأسيس الجمعية</label>
            <div className="aadd-input-with-icon left">
              <Calendar className="aadd-icon-left" size={18} />
              <input 
                type="date" 
                name="establishment_date"
                value={formData.establishment_date}
                onChange={handleChange}
                className="aadd-input" 
              />
            </div>
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
