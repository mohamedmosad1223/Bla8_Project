import React, { useState } from 'react';
import { orgService } from '../../services/orgService';
import { authService } from '../../services/authService';
import { Upload, Calendar, ChevronDown, Phone, Mail, Building2, FileText, AlertTriangle } from 'lucide-react';
import '../../pages/PartnerRegister/PartnerRegister.css'; // Use exact styles

const RejectedAssociationView = ({ profile }: { profile: any }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: profile.organization_name || '',
    licenseNumber: profile.license_number || '',
    establishmentDate: profile.establishment_date || '',
    countryId: profile.country_id || '',
    governorate: profile.governorate || '',
    managerName: profile.manager_name || '',
    phone: profile.phone || '',
    email: profile.user?.email || profile.email || '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('organization_name', formData.organizationName);
      payload.append('license_number', formData.licenseNumber);
      payload.append('establishment_date', formData.establishmentDate);
      payload.append('country_id', formData.countryId);
      payload.append('governorate', formData.governorate);
      payload.append('manager_name', formData.managerName);
      payload.append('phone', formData.phone);
      payload.append('email', formData.email);
      // Backend expects email under 'email' or 'org_email' for update, org_email is safe
      payload.append('org_email', formData.email); 
      
      if (file) {
        payload.append('license_file', file);
      }

      await orgService.updateFormData(profile.org_id, payload);
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'حدث خطأ أثناء تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="pd-page dashboard-page" dir="rtl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '2rem' }}>
        <div style={{ background: '#fffcfc', padding: '3rem', borderRadius: '12px', border: '1px solid #fee2e2', maxWidth: '600px', width: '100%', textAlign: 'center' }}>
          <AlertTriangle size={64} color="#dc2626" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', fontWeight: 700, color: '#dc2626' }}>تم رفض حساب الجمعية</h2>
          <p style={{ color: '#4b5563', lineHeight: 1.6, marginBottom: '2rem', fontSize: '1.1rem' }}>
            نأسف لإبلاغك بأنه تم رفض طلب انضمام الجمعية. يمكنك الاطلاع على الأسباب من الإشعارات بالأعلى. <br/>
            لإعادة التقديم، يرجى تعديل بيانات الجمعية وإعادة رفع الترخيص.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
            <button 
              onClick={() => setIsEditing(true)}
              className="auth-btn primary-btn login-btn" style={{ margin: 0, background: '#dc2626', border: 'none', color: 'white', padding: '0.8rem 0', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              تعديل البيانات وإعادة التقديم
            </button>
            <button 
              onClick={() => authService.logout().then(() => window.location.href = '/')}
              style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.8rem 0', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-page" dir="rtl" style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff' }}>
      <div className="partner-register-container" style={{ width: '100%', maxWidth: '700px' }}>
        <div className="partner-form-container" style={{ margin: '0 auto', maxWidth: '600px', width: '100%', padding: '0 1rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' }}>تعديل بيانات الجمعية</h2>
            <p style={{ color: '#718096', fontSize: '0.95rem' }}>من فضلك قم بتحديث البيانات التالية لإعادة الطلب</p>
          </div>

          <form className="partner-form" onSubmit={handleSubmit}>
            
            {/* Row 1 */}
            <div className="form-group full-width">
              <div className="input-with-icon">
                <input type="text" name="organizationName" placeholder="اسم الجمعية" value={formData.organizationName} onChange={handleInputChange} required />
                <span className="icon-wrapper"><Building2 size={18} /></span>
              </div>
            </div>

            {/* Row 2 */}
            <div className="form-group half-width">
              <div className="input-with-icon">
                <input type="text" name="licenseNumber" placeholder="رقم الترخيص" value={formData.licenseNumber} onChange={handleInputChange} required />
                <span className="icon-wrapper"><FileText size={18} /></span>
              </div>
            </div>
            <div className="form-group half-width">
              <div className="input-with-icon file-upload-wrapper">
                <input type="file" id="license-upload" className="file-input" onChange={handleFileChange} />
                <label htmlFor="license-upload" className="file-label">
                  {file ? file.name : 'إرفاق رخصة الجمعية (اخياري للتغيير)'}
                </label>
                <span className="icon-wrapper"><Upload size={18} /></span>
              </div>
            </div>

            {/* Row 3 */}
            <div className="form-group full-width">
              <div className="input-with-icon">
                <input type="date" name="establishmentDate" placeholder="تاريخ انشاء الجمعية" value={formData.establishmentDate} onChange={handleInputChange} required style={{ fontFamily: 'inherit' }} />
                <span className="icon-wrapper"><Calendar size={18} /></span>
              </div>
            </div>

            {/* Row 4 */}
            <div className="form-group half-width">
              <div className="input-with-icon select-wrapper">
                <select name="countryId" value={formData.countryId} onChange={handleInputChange} required>
                  <option value="" disabled>الدولة</option>
                  <option value="1">مصر</option>
                  <option value="2">السعودية</option>
                  <option value="5">الكويت</option>
                </select>
                <span className="icon-wrapper"><ChevronDown size={18} /></span>
              </div>
            </div>
            <div className="form-group half-width">
              <div className="input-with-icon select-wrapper">
                <select name="governorate" value={formData.governorate} onChange={handleInputChange} required>
                   <option value="" disabled>المحافظة</option>
                   <option value="jahra">محافظة الجهراء</option>
                   <option value="asima">محافظة العاصمة</option>
                   <option value="farwaniya">محافظة الفروانية</option>
                   <option value="hawalli">محافظة حولي</option>
                   <option value="mubarak_al_kabeer">محافظة مبارك الكبير</option>
                   <option value="ahmadi">محافظة الأحمدي</option>
                   <option value="other">أخرى</option>
                </select>
                <span className="icon-wrapper"><ChevronDown size={18} /></span>
              </div>
            </div>

            {/* Row 5 */}
            <div className="form-group full-width">
              <div className="input-with-icon">
                <input type="text" className="input-default" name="managerName" placeholder="اسم مدير الجمعية" value={formData.managerName} onChange={handleInputChange} required />
                <span className="icon-wrapper"><FileText size={18} /></span>
              </div>
            </div>

            {/* Row 6 */}
            <div className="form-group full-width">
              <div className="input-with-icon">
                <input type="tel" name="phone" placeholder="رقم الهاتف أو الجوال" value={formData.phone} onChange={handleInputChange} required />
                <span className="icon-wrapper"><Phone size={18} /></span>
              </div>
            </div>

            {/* Row 7 */}
            <div className="form-group full-width">
              <div className="input-with-icon">
                <input type="email" name="email" placeholder="البريد الالكتروني" value={formData.email} onChange={handleInputChange} required />
                <span className="icon-wrapper"><Mail size={18} /></span>
              </div>
            </div>

            <div style={{ clear: 'both', width: '100%', paddingTop: '15px' }}>
              <button type="submit" className="auth-btn primary-btn submit-partner-btn full-width" disabled={loading} style={{ marginTop: '0' }}>
                {loading ? 'جاري الإرسال...' : 'حفظ وإعادة إرسال'}
              </button>
              
              <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="auth-btn" 
                  style={{ background: 'transparent', color: '#6b7280', marginTop: '10px', width: '100%', border: 'none', padding: '0.8rem 0', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  إلغاء التعديل
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RejectedAssociationView;
