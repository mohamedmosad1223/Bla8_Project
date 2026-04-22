import React, { useState } from 'react';
import { User, Mail, Phone, ChevronLeft, ChevronRight, ChevronDown, Lock, Eye, EyeOff, Globe, HelpCircle, Shield, Trash2, Camera, PhoneCall, HelpCircle as HelpIcon, Search, Plus, Minus, FileText } from 'lucide-react';
import { profileService } from '../../services/profileService';
import { authService } from '../../services/authService';
import ForgotPasswordModal from '../../components/common/Modal/ForgotPasswordModal';
import { useLanguage, LANGUAGES } from '../../i18n';
import './Profile.css';

type ActiveSection = 'account-info' | 'change-password' | 'language' | 'help-center' | 'help-center-faq' | 'customer-service' | 'privacy-policy';

// ── Help Center (3-card layout) ─────────────────────────
const HelpCenter: React.FC<{ onSectionChange: (sec: ActiveSection) => void }> = ({ onSectionChange }) => {
  const { t, dir } = useLanguage();
  return (
    <div className="help-center-v2" dir={dir}>
      <div className="help-header-simple">
        <div className="help-breadcrumbs">
          <span className="inactive">{t('profile.helpCenter') || 'مركز المساعدة'}</span>
        </div>
        <button className="help-back-btn" onClick={() => onSectionChange('account-info')} style={{flexDirection: dir === 'ltr' ? 'row-reverse' : 'row'}}>
          <span>{t('profile.helpBack') || 'عودة'}</span>
          {dir === 'ltr' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <div className="help-cards-list">
        <button className="help-card" onClick={() => onSectionChange('help-center-faq')} style={{flexDirection: dir === 'ltr' ? 'row' : 'row'}}>
          <div className="help-card-right">
            <div className="help-card-icon-wrap blue">
              <HelpIcon size={24} />
            </div>
            <div className="help-card-info">
              <h4>{t('profile.faqTitle') || 'الأسئلة الشائعة'}</h4>
              <p>{t('profile.faqDesc') || 'راسل مساعدنا الافتراضي'}</p>
            </div>
          </div>
          {dir === 'ltr' ? <ChevronRight size={20} className="help-card-arrow" /> : <ChevronLeft size={20} className="help-card-arrow" />}
        </button>

        <a 
          href="https://mail.google.com/mail/?view=cm&fs=1&to=balagh.ai2026@gmail.com&su=Support%20Request" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="help-card"
        >
          <div className="help-card-right">
            <div className="help-card-icon-wrap green">
              <Mail size={24} />
            </div>
            <div className="help-card-info">
              <h4>{t('profile.customerService') || 'خدمة العملاء'}</h4>
              <p>balagh.ai2026@gmail.com</p>
            </div>
          </div>
          {dir === 'ltr' ? <ChevronRight size={20} className="help-card-arrow" /> : <ChevronLeft size={20} className="help-card-arrow" />}
        </a>

        <a href="tel:+20123232323" className="help-card">
          <div className="help-card-right">
            <div className="help-card-icon-wrap blue-light">
              <PhoneCall size={24} />
            </div>
            <div className="help-card-info">
              <h4>{t('profile.callUs') || 'اتصل بنا الآن'}</h4>
              <p dir="ltr" className="help-phone">+20 123 232 323</p>
            </div>
          </div>
          {dir === 'ltr' ? <ChevronRight size={20} className="help-card-arrow" /> : <ChevronLeft size={20} className="help-card-arrow" />}
        </a>
      </div>

      <p className="help-working-hours">{t('profile.workingHours') || 'من السبت الى الخميس الساعة 08 صباحا الى 05 مساء'}</p>
    </div>
  );
};

// ── FAQ Section (Detailed View) ───────────────────────────
const FAQSection: React.FC<{ onSectionChange: (sec: ActiveSection) => void }> = ({ onSectionChange }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(1);
  const { t, dir } = useLanguage();
  const faqItems = [
    { q: t('faq.q1') || 'ما هي منصة "بلاغ"؟', a: t('faq.a1') || 'منصة تهدف لتسهيل عملية التعريف بالإسلام وربط الدعاة بالمهتمين.' },
    { q: t('faq.q2') || 'من أين تأتي المعلومات الدينية؟', a: t('faq.a2') || 'نعتمد على مكتبة دينية شاملة.' },
    { q: t('faq.q3') || 'هل يمكنني الوصول للمصادر؟', a: t('faq.a3') || 'نعم، توفر المنصة قسماً خاصاً.' },
    { q: t('faq.q4') || 'هل التواصل آمن؟', a: t('faq.a4') || 'نعم، المنصة تضمن خصوصية بياناتك.' },
    { q: t('faq.q5') || 'ماذا أفعل لحل مشكلة تقنية؟', a: t('faq.a5') || 'يمكنك التواصل مع الدعم الفني.' },
  ];

  return (
    <div className="faq-v2-container" dir={dir}>
      <div className="help-header-simple">
        <div className="help-breadcrumbs">
          <span className="active-bc">{t('profile.faqTitle') || 'الأسئلة الشائعة'}</span>
          <span className="sep">{dir === 'ltr' ? '‹' : '›'}</span>
          <span className="inactive">{t('profile.helpCenter') || 'مركز المساعدة'}</span>
        </div>
        <button className="help-back-btn" onClick={() => onSectionChange('help-center')} style={{flexDirection: dir === 'ltr' ? 'row-reverse' : 'row'}}>
          <span>{t('profile.helpBack') || 'عودة'}</span>
          {dir === 'ltr' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <p className="faq-v2-intro">{t('profile.faqIntro') || 'عندك أي أسئلة؟ تصفح الأسئلة الشائعة'}</p>

      <div className="faq-search-wrap">
        <Search size={20} className="faq-search-icon" />
        <input type="text" placeholder={t('profile.searchFaq') || 'ابحث'} className="faq-search-input" />
      </div>

      <div className="faq-v2-list">
        {faqItems.map((item, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} className={`faq-v2-item ${isOpen ? 'open' : ''}`}>
              <button className="faq-v2-toggle" onClick={() => setOpenIdx(isOpen ? null : i)}>
                {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                <span className="faq-v2-q-text">{item.q}</span>
              </button>
              {isOpen && <p className="faq-v2-answer">{item.a}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Privacy Policy ────────────────────────────────────────
const PrivacyPolicy: React.FC = () => {
  const { t, dir } = useLanguage();
  const privacySections = [
    { title: t('privacy.t1') || 'جمع البيانات', body: t('privacy.b1') || 'نقوم بجمع البيانات...' },
    { title: t('privacy.t2') || 'استخدام المعلومات', body: t('privacy.b2') || 'تُستخدم بياناتك فقط...' },
    { title: t('privacy.t3') || 'حماية البيانات', body: t('privacy.b3') || 'لا نقوم بمشاركة أو بيع بياناتك...' },
    { title: t('privacy.t4') || 'أمن المعلومات', body: t('privacy.b4') || 'نستخدم تقنيات تشفير...' },
    { title: t('privacy.t5') || 'حقوق المستخدم', body: t('privacy.b5') || 'يمكنك تعديل بياناتك...' },
  ];

  return (
    <div className="privacy-v2-container" dir={dir}>
      <div className="privacy-header">
        <Shield size={32} className="privacy-header-icon" />
        <h3>{t('profile.privacyTitle') || 'سياسة الخصوصية'}</h3>
        <p>{t('profile.privacyUpdated') || 'آخر تحديث: مارس 2024'}</p>
      </div>

      <div className="privacy-sections">
        {privacySections.map((sec, i) => (
          <div key={i} className="privacy-v2-section">
            <div className="privacy-v2-title">
              <span className="dot" />
              <h4>{sec.title}</h4>
            </div>
            <p className="privacy-v2-body">{sec.body}</p>
          </div>
        ))}
      </div>

      <div className="privacy-footer">
        <p>{t('profile.downloadDesc') || 'يمكنك تحميل نسخة كاملة...'}</p>
        <a href="#" className="privacy-download-btn">
          <FileText size={18} />
          {t('profile.downloadFile') || 'تحميل الملف'}
        </a>
      </div>
    </div>
  );
};

// ── Main Profile component ────────────────────────────────
const Profile: React.FC = () => {
  const { t, dir, lang, setLanguage } = useLanguage();
  const userRole = localStorage.getItem('userRole');
  const isNonMuslim = userRole === 'non_muslim' || userRole === 'interested';
  const [activeSection, setActiveSection] = useState<ActiveSection>('account-info');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // --- Form State ---
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    profilePicture: ''
  });
  const [originalForm, setOriginalForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    profilePicture: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // --- Password Visibility States ---
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showModalPasswordVisible, setShowModalPasswordVisible] = useState(false);

  // --- Edit Protection State ---
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalPassword, setModalPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const [selectedLanguage, setSelectedLanguage] = useState(lang);

  const handleLanguageSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLanguage(selectedLanguage as any);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    try {
      await profileService.updateProfile({ profile_picture: file });
      // Refresh user data to get the new image path
      const freshData = await authService.getMe();
      if (freshData) {
        setForm(prev => ({ ...prev, profilePicture: freshData.profile_picture }));
        setOriginalForm(prev => ({ ...prev, profilePicture: freshData.profile_picture }));
      }
      setSuccessMessage('تم تحديث صورة الملف الشخصي بنجاح');
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء رفع الصورة. يرجى التأكد من نوع الملف وحجمه.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      // Re-login to verify password
      const rawData = localStorage.getItem('userData');
      const data = rawData ? JSON.parse(rawData) : null;
      const actualEmail = data?.user?.email || data?.email || form.email;
      
      await authService.login(actualEmail, modalPassword);
      // Success
      setIsEditing(true);
      setShowPasswordModal(false);
      setModalPassword('');
    } catch (err: any) {
      setModalError('كلمة المرور غير صحيحة');
    } finally {
      setModalLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if anything changed
    if (
      form.fullName === originalForm.fullName &&
      form.email === originalForm.email &&
      form.phone === originalForm.phone
    ) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      // Call API with form data
      await profileService.updateProfile({
        full_name: form.fullName,
        email: form.email,
        phone: form.phone
      });
      
      // Refresh local user data via authService
      await authService.getMe();
      
      // Close editing mode and show success modal
      setIsEditing(false);
      setOriginalForm({ ...form });
      setSuccessMessage('لقد تم تحديث بياناتك بنجاح');
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء تحديث البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMsg('كلمات المرور الجديدة غير متطابقة');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setErrorMsg('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await profileService.changePassword({
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword,
        password_confirm: passwordForm.confirmPassword
      });

      setSuccessMessage('لقد تم تغيير كلمة المرور بنجاح');
      setShowSuccessModal(true);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setActiveSection('account-info');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await authService.forgotPassword(form.email);
      // Open modal instead of navigating
      setIsForgotModalOpen(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'حدث خطأ أثناء إرسال رمز التغيير');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      await profileService.deleteAccount(modalPassword);
      // Clear all user data
      localStorage.clear();
      // Redirect to login
      window.location.href = '/login';
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setModalError(detail[0]?.msg || 'خطأ في التحقق من البيانات');
      } else {
        setModalError(detail || 'كلمة المرور غير صحيحة');
      }
    } finally {
      setModalLoading(false);
    }
  };

  // Load user data on mount
  React.useEffect(() => {
    const rawData = localStorage.getItem('userData');
    if (rawData) {
      try {
        const data = JSON.parse(rawData);
        const name = data?.profile?.full_name || data?.profile?.name || data?.full_name || data?.name || data?.organization_name || '';
        const email = data?.user?.email || data?.email || '';
        const phone = data?.profile?.phone || data?.phone || '';
        const pic = data?.profile_picture || '';
        
        const userData = { fullName: name, email, phone, profilePicture: pic };
        setForm(userData);
        setOriginalForm(userData);
      } catch (err) {
        console.error("Failed to parse user data", err);
      }
    }
  }, []);

  const showAvatar = !['help-center', 'help-center-faq', 'privacy-policy'].includes(activeSection);

  // Map each section to its display label + icon for the mobile trigger button
  const sectionMeta: Record<string, { label: string; icon: React.ReactNode }> = {
    'account-info':     { label: isNonMuslim ? t('profile.accountInfo')    : 'بيانات الحساب',     icon: <User size={18} className="settings-item-icon" /> },
    'change-password':  { label: isNonMuslim ? t('profile.changePassword') : 'تغيير الرقم السري', icon: <Lock size={18} className="settings-item-icon" /> },
    'language':         { label: isNonMuslim ? t('profile.language')        : 'اللغة',             icon: <Globe size={18} className="settings-item-icon" /> },
    'help-center':      { label: isNonMuslim ? t('profile.helpCenter')      : 'مركز المساعدة',     icon: <HelpCircle size={18} className="settings-item-icon" /> },
    'help-center-faq':  { label: isNonMuslim ? t('profile.helpCenter')      : 'مركز المساعدة',     icon: <HelpCircle size={18} className="settings-item-icon" /> },
    'customer-service': { label: isNonMuslim ? t('profile.helpCenter')      : 'خدمة العملاء',      icon: <HelpCircle size={18} className="settings-item-icon" /> },
    'privacy-policy':   { label: isNonMuslim ? t('profile.privacyPolicy')   : 'سياسة الخصوصية',   icon: <Shield size={18} className="settings-item-icon" /> },
  };
  const activeMeta = sectionMeta[activeSection] ?? sectionMeta['account-info'];

  return (
    <div className="profile-page" dir={isNonMuslim ? dir : 'rtl'}>
      <h1 className="profile-title">{isNonMuslim ? t('profile.title') : 'الملف الشخصي'}</h1>

      <div className="profile-layout">

        {/* ─── Left panel ─── */}
        <div className="profile-main-panel">

          {/* Avatar — hidden for non-form sections */}
          {showAvatar && (
            <div className="avatar-wrapper">
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              <div className="avatar-circle" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                {form.profilePicture ? (
                  <img src={`/uploads/${form.profilePicture}`} alt="Avatar" />
                ) : (
                  <img src="/avatar_placeholder.png" alt="Avatar" onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    (e.currentTarget.parentElement as HTMLElement).style.background = '#c8d9ec';
                  }} />
                )}
              </div>
              <button className="avatar-camera-btn" title="تغيير الصورة" onClick={handleAvatarClick}>
                <Camera size={16} />
              </button>
            </div>
          )}

          {/* Account info form */}
          {activeSection === 'account-info' && (
            <form className="profile-form" onSubmit={handleFormSubmit}>
              {errorMsg && <div style={{ color: 'red', marginBottom: '15px' }}>{errorMsg}</div>}
              <div className="pf-input-icon">
                <input 
                  type="text" 
                  placeholder={isNonMuslim ? t('profile.fullName') : 'الاسم بالكامل'} 
                  value={form.fullName}
                  onChange={(e) => setForm({...form, fullName: e.target.value})}
                  disabled={!isEditing}
                />
                <span className="pf-icon"><User size={18} /></span>
              </div>
              <div className="pf-input-icon">
                <input 
                  type="email" 
                  placeholder={isNonMuslim ? t('profile.email') : 'البريد الالكتروني'} 
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  disabled={!isEditing}
                />
                <span className="pf-icon"><Mail size={18} /></span>
              </div>
              <div className="pf-input-icon">
                <input 
                  type="tel" 
                  placeholder={isNonMuslim ? t('profile.phone') : 'رقم الهاتف'} 
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  disabled={!isEditing}
                />
                <span className="pf-icon"><Phone size={18} /></span>
              </div>
              
              {!isEditing ? (
                <button type="button" className="pf-save-btn" onClick={() => setShowPasswordModal(true)}>
                  {isNonMuslim ? t('profile.editData') : 'تعديل البيانات'}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="pf-save-btn" disabled={loading} style={{ flex: 1 }}>
                    {loading ? (isNonMuslim ? t('profile.saving') : 'جاري الحفظ...') : (isNonMuslim ? t('profile.saveEdits') : 'حفظ التعديلات')}
                  </button>
                  <button type="button" className="pf-save-btn" style={{ flex: 1, backgroundColor: '#f44336' }} onClick={() => {
                    setIsEditing(false);
                    setErrorMsg('');
                  }}>
                    {isNonMuslim ? t('profile.cancelEdit') : 'إلغاء التعديل'}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Change password form */}
          {activeSection === 'change-password' && (
            <form className="profile-form" onSubmit={handlePasswordChange}>
              {errorMsg && <div style={{ color: 'red', marginBottom: '15px' }}>{errorMsg}</div>}
              <div className="pf-input-icon">
                <input 
                  type={showOldPassword ? "text" : "password"} 
                  placeholder={isNonMuslim ? t('profile.currentPassword') : "كلمة المرور الحالية"} 
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                  required
                />
                <span className="pf-icon"><Lock size={18} /></span>
                <button type="button" className="pf-eye-btn" onClick={() => setShowOldPassword(!showOldPassword)}>
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="pf-input-icon">
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  placeholder={isNonMuslim ? t('profile.newPassword') : "كلمة المرور الجديدة"} 
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  required
                />
                <span className="pf-icon"><Lock size={18} /></span>
                <button type="button" className="pf-eye-btn" onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="pf-input-icon">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder={isNonMuslim ? t('profile.confirmPassword') : "تأكيد كلمة المرور"} 
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  required
                />
                <span className="pf-icon"><Lock size={18} /></span>
                <button type="button" className="pf-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="pf-forgot-password">
                <button type="button" onClick={handleForgotPassword} disabled={loading}>
                  {loading ? (isNonMuslim ? t('profile.sendingReset') : 'جاري الإرسال...') : (isNonMuslim ? t('profile.forgotPin') : 'نسيت الرقم السري؟')}
                </button>
              </div>

              <button type="submit" className="pf-save-btn" disabled={loading}>
                {loading ? (isNonMuslim ? t('profile.saving') : 'جاري الحفظ...') : (isNonMuslim ? t('profile.saveEdits') : 'حفظ')}
              </button>
            </form>
          )}

          {/* Language selector */}
          {activeSection === 'language' && (
            <form className="profile-form" onSubmit={handleLanguageSave}>
              <div className="pf-input-icon">
                <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
                <span className="pf-icon"><Globe size={18} /></span>
              </div>
              <button type="submit" className="pf-save-btn">{t('profile.saveLanguage') || 'حفظ'}</button>
            </form>
          )}

          {/* Help Center */}
          {activeSection === 'help-center' && <HelpCenter onSectionChange={setActiveSection} />}

          {/* Help Center FAQ */}
          {activeSection === 'help-center-faq' && <FAQSection onSectionChange={setActiveSection} />}

          {/* Customer Service Chat - Removed as it uses Mailto */}
          {activeSection === 'customer-service' && <HelpCenter onSectionChange={setActiveSection} />}

          {/* Privacy Policy */}
          {activeSection === 'privacy-policy' && <PrivacyPolicy />}
        </div>

        {/* ─── Right panel: Settings menu ─── */}
        <div className={`profile-settings-panel${mobileSettingsOpen ? ' mobile-open' : ''}`}>

          <div className="settings-section">
            <h3 className="settings-section-title">{isNonMuslim ? t('profile.editAccount') : 'تعديل الحساب'}</h3>

            {/* ── Mobile-Only Dropdown Trigger ── */}
            <button
              className="settings-item nm-settings-trigger active"
              onClick={() => setMobileSettingsOpen(o => !o)}
            >
              <ChevronDown size={16} className="settings-mobile-arrow" />
              <span>{activeMeta.label}</span>
              {activeMeta.icon}
            </button>

            {/* ── Standard 'Account Info' Button (Desktop + Mobile List) ── */}
            <button
              className={`settings-item nm-settings-account-btn ${activeSection === 'account-info' ? 'active' : ''}`}
              onClick={() => { setActiveSection('account-info'); setMobileSettingsOpen(false); }}
            >
              <ChevronLeft size={16} className="settings-chevron" />
              <span>{isNonMuslim ? t('profile.accountInfo') : 'بيانات الحساب'}</span>
              <User size={18} className="settings-item-icon" />
            </button>

            <button
              className={`settings-item ${activeSection === 'change-password' ? 'active' : ''}`}
              onClick={() => { setActiveSection('change-password'); setMobileSettingsOpen(false); }}
            >
              <ChevronLeft size={16} className="settings-chevron" />
              <span>{isNonMuslim ? t('profile.changePassword') : 'تغيير الرقم السري'}</span>
              <Lock size={18} className="settings-item-icon" />
            </button>

            {isNonMuslim && (
              <button
                className={`settings-item ${activeSection === 'language' ? 'active' : ''}`}
                onClick={() => { setActiveSection('language'); setMobileSettingsOpen(false); }}
              >
                <ChevronLeft size={16} className="settings-chevron" />
                <span>{isNonMuslim ? t('profile.language') : 'اللغة'}</span>
                <Globe size={18} className="settings-item-icon" />
              </button>
            )}
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">{isNonMuslim ? t('profile.support') : 'الدعم الفني والخصوصية'}</h3>

            <button
              className={`settings-item ${['help-center', 'help-center-faq', 'customer-service'].includes(activeSection) ? 'active' : ''}`}
              onClick={() => { setActiveSection('help-center'); setMobileSettingsOpen(false); }}
            >
              <ChevronLeft size={16} className="settings-chevron" />
              <span>{isNonMuslim ? t('profile.helpCenter') : 'مركز المساعدة'}</span>
              <HelpCircle size={18} className="settings-item-icon" />
            </button>

            <button
              className={`settings-item ${activeSection === 'privacy-policy' ? 'active' : ''}`}
              onClick={() => { setActiveSection('privacy-policy'); setMobileSettingsOpen(false); }}
            >
              <ChevronLeft size={16} className="settings-chevron" />
              <span>{isNonMuslim ? t('profile.privacyPolicy') : 'سياسة الخصوصية'}</span>
              <Shield size={18} className="settings-item-icon" />
            </button>

            <button className="settings-item danger" onClick={() => { setShowDeleteModal(true); setMobileSettingsOpen(false); }}>
              <ChevronLeft size={16} className="settings-chevron" />
              <span>{isNonMuslim ? t('profile.deleteAccount') : 'حذف الحساب'}</span>
              <Trash2 size={18} className="settings-item-icon" />
            </button>
          </div>
        </div>

      </div>

      {/* ─── Delete Account Confirmation Modal ─── */}
      {showDeleteModal && (
        <div className="delete-modal-overlay" dir="rtl">
          <div className="delete-modal">
            <button className="delete-modal-close" onClick={() => {
              setShowDeleteModal(false);
              setModalError('');
              setModalPassword('');
            }}>×</button>
            <h3 className="delete-modal-title">{isNonMuslim ? t('profile.deleteConfirmTitle') : 'هل انت متأكد من حذف الحساب؟'}</h3>
            <p className="delete-modal-desc" style={{ marginBottom: '15px' }}>
              {isNonMuslim ? t('profile.deleteConfirmDesc') : 'سيتم حذف جميع بياناتك نهائياً من قاعدة البيانات. يرجى إدخال كلمة المرور للتأكيد.'}
            </p>
            
            <form onSubmit={handleDeleteAccount}>
              <div className="pf-input-icon" style={{ marginBottom: '20px' }}>
                <input 
                  type={showModalPasswordVisible ? "text" : "password"} 
                  placeholder={isNonMuslim ? t('profile.passwordPlaceholder') : "كلمة المرور"} 
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                  required
                />
                <span className="pf-icon"><Lock size={18} /></span>
                <button type="button" className="pf-eye-btn" onClick={() => setShowModalPasswordVisible(!showModalPasswordVisible)}>
                  {showModalPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {modalError && <div style={{ color: 'red', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>{modalError}</div>}

              <div className="delete-modal-actions">
                <button type="submit" className="delete-modal-confirm" disabled={modalLoading}>
                  {modalLoading ? (isNonMuslim ? t('profile.deleteLoading') : 'جاري الحذف...') : (isNonMuslim ? t('profile.deleteFinal') : 'حذف نهائياً')}
                </button>
                <button type="button" className="delete-modal-cancel" onClick={() => setShowDeleteModal(false)}>{isNonMuslim ? t('profile.cancelBtn') : 'الغاء'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Password Verification Modal (Before Edit) ─── */}
      {showPasswordModal && (
        <div className="delete-modal-overlay" dir="rtl">
          <div className="delete-modal">
            <button className="delete-modal-close" onClick={() => {
              setShowPasswordModal(false);
              setModalError('');
              setModalPassword('');
            }}>×</button>
            <h3 className="delete-modal-title">{isNonMuslim ? t('profile.verifyTitle') : 'تأكيد الهوية'}</h3>
            <p className="delete-modal-desc" style={{ marginBottom: '20px' }}>
              {isNonMuslim ? t('profile.verifyDesc') : 'يرجى إدخال كلمة المرور الخاصة بك لتتمكن من تعديل بياناتك.'}
            </p>
            
            <form onSubmit={handleVerifyPassword}>
              <div className="pf-input-icon" style={{ marginBottom: '20px' }}>
                <input 
                  type={showModalPasswordVisible ? "text" : "password"} 
                  placeholder={isNonMuslim ? t('profile.passwordPlaceholder') : "كلمة المرور"} 
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                  autoFocus
                  required
                />
                <span className="pf-icon"><Lock size={18} /></span>
                <button type="button" className="pf-eye-btn" onClick={() => setShowModalPasswordVisible(!showModalPasswordVisible)}>
                  {showModalPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {modalError && <div style={{ color: 'red', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>{modalError}</div>}
              
              <div className="delete-modal-actions">
                <button type="submit" className="delete-modal-confirm" disabled={modalLoading} style={{ backgroundColor: '#183141' }}>
                  {modalLoading ? (isNonMuslim ? t('profile.verifying') : 'جاري التحقق...') : (isNonMuslim ? t('common.confirm') : 'تأكيد')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Success Modal (New Design) ─── */}
      {showSuccessModal && (
        <div className="delete-modal-overlay" dir="rtl">
          <div className="success-modal-v2">
            <div className="success-dragger"></div>
            
            <div className="success-wavy-icon">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M40 0C42.8722 0 45.4552 1.54719 46.8504 3.99282C48.5135 2.8258 50.5901 2.39296 52.6106 2.79155C54.6311 3.19013 56.4173 4.38466 57.5614 6.10427C59.6247 5.6133 61.8016 5.864 63.6879 6.80983C65.5742 7.75567 67.0141 9.32049 67.7397 11.2139C69.7523 11.3972 71.6186 12.3082 72.9904 13.7779C74.3622 15.2475 75.1274 17.1554 75.1436 19.1466C76.9922 20.0163 78.4116 21.5732 79.1362 23.525C79.8608 25.4768 79.8291 27.6577 79.0471 29.6582C80.252 31.2582 80.826 33.2505 80.6481 35.2152C80.4702 37.1798 79.5558 38.9482 78.1065 40.1466C79.5558 41.345 80.4702 43.1134 80.6481 45.078C80.826 47.0427 80.252 49.035 79.0471 50.635C79.8291 52.6355 79.8608 54.8164 79.1362 56.7682C78.4116 58.7199 76.9922 60.2769 75.1436 61.1466C75.1274 63.1378 74.3622 65.0457 72.9904 66.5153C71.6186 67.985 69.7523 68.8959 67.7397 69.0792C67.0141 70.9727 65.5742 72.5375 63.6879 73.4833C61.8016 74.4292 59.6247 74.6798 57.5614 74.1889C56.4173 75.9085 54.6311 77.1031 52.6106 77.5016C50.5901 77.9002 48.5135 77.4674 46.8504 76.3003C45.4552 78.746 42.8722 80.2931 40 80.2931C37.1278 80.2931 34.5448 78.746 33.1496 76.3003C31.4865 77.4674 29.4099 77.9002 27.3894 77.5016C25.3689 77.1031 23.5827 75.9085 22.4386 74.1889C20.3753 74.6798 18.1984 74.4292 16.3121 73.4833C14.4258 72.5375 12.9859 70.9727 12.2603 69.0792C10.2477 68.8959 8.38139 67.985 7.00959 66.5153C5.63779 65.0457 4.87258 63.1378 4.85641 61.1466C3.00783 60.2769 1.58841 58.7199 0.863831 56.7682C0.139257 54.8164 0.17094 52.6355 0.952924 50.635C-0.252033 49.035 -0.826002 47.0427 -0.648083 45.078C-0.470165 43.1134 0.44421 41.345 1.89354 40.1466C0.44421 38.9482 -0.470165 37.1798 -0.648083 35.2152C-0.826001 33.2505 -0.252033 31.2582 0.952924 29.6582C0.17094 27.6577 0.139258 25.4768 0.863832 23.525C1.58841 21.5732 3.00783 20.0163 4.85641 19.1466C4.87258 17.1554 5.63779 15.2475 7.00959 13.7779C8.38139 12.3082 10.2477 11.3972 12.2603 11.2139C12.9859 9.32049 14.4258 7.75567 16.3121 6.80983C18.1984 5.864 20.3753 5.6133 22.4386 6.10427C23.5827 4.38466 25.3689 3.19013 27.3894 2.79155C29.4099 2.39296 31.4865 2.8258 33.1496 3.99282C34.5448 1.54719 37.1278 0 40 0Z" fill="#00D285"/>
                <path d="M26 42L35 51L56 30" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <h3 className="success-modal-title-v2">{successMessage}</h3>
            
            <button 
              className="success-modal-btn" 
              onClick={() => setShowSuccessModal(false)}
            >
              {isNonMuslim ? t('dashboard.successAction') || 'OK' : 'تم'}
            </button>
          </div>
        </div>
      )}
      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={() => setIsForgotModalOpen(false)} 
        email={form.email} 
      />
    </div>
  );
};

export default Profile;
