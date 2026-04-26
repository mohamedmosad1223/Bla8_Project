import React, { useState } from 'react';
import { preacherService } from '../../services/preacherService';
import { authService } from '../../services/authService';
import { User, Phone, Mail, FileText, UploadCloud, AlertTriangle, ChevronDown } from 'lucide-react';
import '../../pages/PreacherRegister/PreacherRegister.css';

const RejectedPreacherView = ({ profile }: { profile: any }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    preacher_email: profile.preacher_email || '',
    scientific_qualification: profile.scientific_qualification || '',
    gender: profile.gender || '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('full_name', formData.full_name);
      payload.append('phone', formData.phone);
      payload.append('preacher_email', formData.preacher_email);
      payload.append('scientific_qualification', formData.scientific_qualification);
      if (formData.gender) {
        payload.append('gender', formData.gender);
      }
      if (file) {
        payload.append('qualification_file', file);
      }

      await preacherService.updateFormData(profile.preacher_id, payload);
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'حدث خطأ أثناء تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="pd-page" dir="rtl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '2rem' }}>
        <div style={{ background: '#fffcfc', padding: '3rem', borderRadius: '12px', border: '1px solid #fee2e2', maxWidth: '600px', width: '100%', textAlign: 'center' }}>
          <AlertTriangle size={64} color="#dc2626" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', fontWeight: 700, color: '#dc2626' }}>حسابك مرفوض</h2>
          <p style={{ color: '#4b5563', lineHeight: 1.6, marginBottom: '2rem', fontSize: '1.1rem' }}>
            تم رفض طلب انضمامك. يرجى مراجعة إشعار الرفض بالأعلى لمعرفة الأسباب، وإجراء التعديلات اللازمة أدناه.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
            <button
              onClick={() => setIsEditing(true)}
              className="auth-btn primary-btn login-btn" style={{ margin: 0, background: '#dc2626', border: 'none', color: 'white', padding: '0.8rem 0', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              تعديل البيانات وإعادة التقديم
            </button>
            <button
              onClick={() => authService.logout().then(() => window.location.href = '/preacher-association-login')}
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
      <div className="preacher-register-container" style={{ width: '100%' }}>
        <div className="preacher-form-container" style={{ margin: '0 auto', maxWidth: '500px', width: '100%', padding: '2rem 1rem' }}>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' }}>تعديل بيانات الداعية</h2>
            <p style={{ color: '#718096', fontSize: '0.95rem' }}>من فضلك قم بتحديث البيانات التالية لإعادة الطلب</p>
          </div>

          <form className="preacher-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input type="text" placeholder="الاسم بالكامل" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                <span className="preg-icon"><User size={18} /></span>
              </div>
            </div>

            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input type="text" placeholder="رقم الهاتف" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                <span className="preg-icon"><Phone size={18} /></span>
              </div>
            </div>

            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input type="email" placeholder="البريد الإلكتروني للداعية" value={formData.preacher_email} onChange={(e) => setFormData({ ...formData, preacher_email: e.target.value })} required />
                <span className="preg-icon"><Mail size={18} /></span>
              </div>
            </div>

            <div className="preg-row" style={{ display: 'flex', gap: '1rem' }}>
              <div className="preg-group" style={{ flex: 1 }}>
                <div className="preg-input-icon">
                  <input type="text" placeholder="اكتب اسم ونوع المؤهل" value={formData.scientific_qualification} onChange={(e) => setFormData({ ...formData, scientific_qualification: e.target.value })} required />
                  <span className="preg-icon" style={{ right: 'unset', left: '1rem' }}><FileText size={18} /></span>
                </div>
              </div>

              <div className="preg-group" style={{ flex: 1 }}>
                <div className="preg-input-icon preg-file-wrap">
                  <input type="file" id="cert-upload" className="preg-file-input" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <label htmlFor="cert-upload" className="preg-file-label">
                    {file ? file.name : 'ارفع شهاداتك (اختياري)'}
                  </label>
                  <span className="preg-icon"><UploadCloud size={18} /></span>
                </div>
              </div>
            </div>

            <div className="preg-group full-width relative">
              <div className="preg-input-icon tags-input-container" style={{ padding: 0 }}>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  style={{ width: '100%', border: 'none', background: 'transparent', padding: '1rem 3.5rem 1rem 1rem', outline: 'none', appearance: 'none', cursor: 'pointer', color: formData.gender ? 'var(--text-dark)' : '#a0aec0' }}
                  required
                >
                  <option value="" disabled>النوع</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
                <span className="preg-icon" style={{ left: '1.25rem', right: 'unset' }}>
                  <ChevronDown size={18} />
                </span>
                <span className="preg-icon" style={{ width: 'auto' }}>
                  <User size={18} />
                </span>
              </div>
            </div>

            <button type="submit" className="auth-btn primary-btn" disabled={loading} style={{ marginTop: '1.5rem' }}>
              {loading ? 'جاري الحفظ...' : 'حفظ وإعادة إرسال'}
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="auth-btn"
              style={{ background: 'transparent', color: '#6b7280', marginTop: '0', width: '100%', border: 'none', padding: '0.8rem 0', fontWeight: 'bold', cursor: 'pointer' }}
            >
              إلغاء التعديل
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RejectedPreacherView;
