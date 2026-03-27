import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Calendar, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import api from '../../services/api';
import '../AdminAddAssociation/AdminAddAssociation.css';

interface Country {
  id: number;
  name: string;
}

const AdminEditAssociation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<'success' | 'error' | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [orgRes, countriesRes] = await Promise.all([
          api.get(`/organizations/${id}`),
          api.get('/preachers/countries')
        ]);
        
        const org = orgRes.data.data;
        setCountries(countriesRes.data.data);
        
        setFormData({
          organization_name: org.organization_name || '',
          manager_name: org.manager_name || '',
          license_number: org.license_number || '',
          country_id: org.country_id || '',
          email: org.email || '',
          phone: org.phone || '',
          governorate: org.governorate || '',
          establishment_date: org.establishment_date ? org.establishment_date.split('T')[0] : '',
          password: '',
          password_confirm: ''
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('تعذر تحميل بيانات الجمعية');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (saving) return;
    
    // Passwords check
    if (formData.password && formData.password !== formData.password_confirm) {
      setError('كلمتا المرور غير متطابقتين');
      setShowStatusModal('error');
      return;
    }

    setSaving(true);
    try {
      const payload: any = { ...formData };
      
      // Don't send empty password
      if (!payload.password) {
        delete payload.password;
        delete payload.password_confirm;
      }

      await api.patch(`/organizations/${id}`, payload);
      setShowStatusModal('success');
    } catch (err: any) {
      console.error('Error updating organization:', err);
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0]?.msg : detail || 'حدث خطأ في الحفظ');
      setShowStatusModal('error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/admin/associations/${id}`);
  };

  if (loading) {
    return (
      <div className="aadd-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loader2 className="animate-spin" size={48} color="#DBA841" />
      </div>
    );
  }

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
          <span className="aadd-crumb-current">تعديل بيانات الجمعية</span>
        </div>
        <h1 className="aadd-title">تعديل بيانات الجمعية</h1>
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
            <label className="aadd-label">البريد الالكتروني (لا يمكن تعديله)</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              readOnly
              className="aadd-input" 
              style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
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
              style={{direction: 'ltr', textAlign: 'right'}} 
            />
          </div>

          {/* Row 4 */}
          <div className="aadd-group">
            <label className="aadd-label">المحافظة</label>
            <input 
              type="text" 
              name="governorate"
              value={formData.governorate}
              onChange={handleChange}
              className="aadd-input" 
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

          {/* Row 5 */}
          <div className="aadd-group">
            <label className="aadd-label">كلمة السر (اتركها فارغة لعدم التغيير)</label>
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
                autoComplete="new-password"
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
              />
            </div>
          </div>
        </div>

        {/* ── Action ── */}
        <div className="aadd-actions" style={{gap: '16px'}}>
          <button 
            className="aadd-save-btn" 
            style={{background: '#F3F4F6', color: '#1A1A2E'}}
            onClick={handleCancel}
          >
            الغاء
          </button>
          <button className="aadd-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={20} /> : 'حفظ التعديل'}
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
            <p className="aadd-status-desc">تم تعديل بيانات الجمعية بنجاح</p>
            <button className="aadd-status-btn success" onClick={() => navigate(`/admin/associations/${id}`)}>
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
            <p className="aadd-status-desc">{error || 'لقد حدث خطأ اثناء حفظ التعديلات'}</p>
            <button className="aadd-status-btn error" onClick={() => setShowStatusModal(null)}>
              حاول مرة اخري
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminEditAssociation;
