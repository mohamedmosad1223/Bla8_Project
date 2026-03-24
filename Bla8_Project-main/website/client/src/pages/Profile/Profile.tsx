import React, { useState } from 'react';
import { User, Mail, Phone, ChevronLeft, ChevronRight, Lock, Eye, EyeOff, Globe, HelpCircle, Shield, Trash2, Camera, MessageSquare, PhoneCall, HelpCircle as HelpIcon, Search, Plus, Minus, FileText, Send, Image as ImageIcon } from 'lucide-react';
import { profileService } from '../../services/profileService';
import { authService } from '../../services/authService';
import ForgotPasswordModal from '../../components/common/Modal/ForgotPasswordModal';
import './Profile.css';

type ActiveSection = 'account-info' | 'change-password' | 'language' | 'help-center' | 'help-center-faq' | 'customer-service' | 'privacy-policy';

const faqItems = [
  { q: 'يكتب السؤال هنا', a: 'إليك بعض النصوص النموذجية التي قد تجيب على سؤال متكرر أو تقدم نصيحة مفيدة للمستخدم. لقد استحوذت علي هدوء رائع يمتلك روحي بالكامل، مثل هذه الصباحات العذبة في الربيع التي أستمتع بها بكل قلبي.' },
  { q: 'يكتب السؤال هنا في تلك المنطقة', a: 'إليك بعض النصوص النموذجية التي قد تجيب على سؤال متكرر أو تقدم نصيحة مفيدة للمستخدم. لقد استحوذت علي هدوء رائع يمتلك روحي بالكامل، مثل هذه الصباحات العذبة في الربيع التي أستمتع بها بكل قلبي.' },
  { q: 'يكتب السؤال هنا', a: 'إليك بعض النصوص النموذجية التي قد تجيب على سؤال متكرر أو تقدم نصيحة مفيدة للمستخدم.' },
  { q: 'يكتب السؤال هنا', a: 'إليك بعض النصوص النموذجية التي قد تجيب على سؤال متكرر أو تقدم نصيحة مفيدة للمستخدم.' },
];

const privacySections = Array(5).fill({
  title: 'معلومات هنا',
  body: 'نقوم بجمع معلومات مثل أسماء قائد الفريق وأعضاء الفريق وتفاصيل الاتصال وسجلات التفتيش لتسهيل إدارة سلامة مكافحة الحرائق.',
});

// ── Help Center (3-card layout) ─────────────────────────
const HelpCenter: React.FC<{ onSectionChange: (sec: ActiveSection) => void }> = ({ onSectionChange }) => {
  return (
    <div className="help-center-v2" dir="rtl">
      <div className="help-header-simple">
        <div className="help-breadcrumbs">
          <span className="inactive">مركز المساعدة</span>
        </div>
        <button className="help-back-btn" onClick={() => onSectionChange('account-info')}>
          <span>عودة</span>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="help-cards-list">
        <button className="help-card" onClick={() => onSectionChange('help-center-faq')}>
          <div className="help-card-right">
            <div className="help-card-icon-wrap blue">
              <HelpIcon size={24} />
            </div>
            <div className="help-card-info">
              <h4>الأسئلة الشائعة</h4>
              <p>راسل مساعدنا الافتراضي أو أحد ممثلينا مباشرة</p>
            </div>
          </div>
          <ChevronLeft size={20} className="help-card-arrow" />
        </button>

        <button className="help-card" onClick={() => onSectionChange('customer-service')}>
          <div className="help-card-right">
            <div className="help-card-icon-wrap green">
              <MessageSquare size={24} />
            </div>
            <div className="help-card-info">
              <h4>خدمة العملاء</h4>
              <p>راسل مساعدنا الافتراضي أو أحد ممثلينا مباشرة</p>
            </div>
          </div>
          <ChevronLeft size={20} className="help-card-arrow" />
        </button>

        <a href="tel:+20123232323" className="help-card no-btn">
          <div className="help-card-right">
            <div className="help-card-icon-wrap blue-light">
              <PhoneCall size={24} />
            </div>
            <div className="help-card-info">
              <h4>اتصل بنا الآن</h4>
              <p dir="ltr" className="help-phone">+20 123 232 323</p>
            </div>
          </div>
          <ChevronLeft size={20} className="help-card-arrow" />
        </a>
      </div>

      <p className="help-working-hours">من السبت الى الخميس الساعة 08 صباحا الى 05 مساء</p>
    </div>
  );
};

// ── FAQ Section (Detailed View) ───────────────────────────
const FAQSection: React.FC<{ onSectionChange: (sec: ActiveSection) => void }> = ({ onSectionChange }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(1);
  return (
    <div className="faq-v2-container" dir="rtl">
      <div className="help-header-simple">
        <div className="help-breadcrumbs">
          <span className="active-bc">الأسئلة الشائعة</span>
          <span className="sep">›</span>
          <span className="inactive">مركز المساعدة</span>
        </div>
        <button className="help-back-btn" onClick={() => onSectionChange('help-center')}>
          <span>عودة</span>
          <ChevronRight size={20} />
        </button>
      </div>

      <p className="faq-v2-intro">عندك أي أسئلة؟ تصفح الأسئلة الشائعة أدناه أو ابحث عن إجابة لسؤالك</p>

      <div className="faq-search-wrap">
        <Search size={20} className="faq-search-icon" />
        <input type="text" placeholder="ابحث" className="faq-search-input" />
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

// ── Customer Service Chat ──────────────────────────────────
const CustomerServiceChat: React.FC<{ onSectionChange: (sec: ActiveSection) => void }> = ({ onSectionChange }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: 'مرحباً بك! كيف يمكننا مساعدتك اليوم؟', sender: 'bot', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    };
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  return (
    <div className="cs-chat-container" dir="rtl">
      <div className="help-header-simple">
        <div className="help-breadcrumbs">
          <span className="active-bc">خدمة العملاء</span>
          <span className="sep">›</span>
          <span className="inactive">مركز المساعدة</span>
        </div>
        <button className="help-back-btn" onClick={() => onSectionChange('help-center')}>
          <span>عودة</span>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="cs-chat-messages">
        <div className="cs-date-separator">أمس</div>
        {messages.map((msg) => (
          <div key={msg.id} className={`cs-message-group ${msg.sender}`}>
            <div className="cs-message-bubble">
              {msg.text}
            </div>
            <span className="cs-message-time">{msg.time}</span>
          </div>
        ))}
      </div>

      <div className="cs-chat-input-area">
        <div className="cs-input-wrapper">
          <button className="cs-icon-btn">
            <ImageIcon size={20} />
          </button>
          <input
            type="text"
            placeholder="اكتب هنا...."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="cs-send-btn" onClick={handleSend}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};


// ── Privacy Policy ────────────────────────────────────────
const PrivacyPolicy: React.FC = () => (
  <div className="privacy-v2-container" dir="rtl">
    <div className="privacy-header">
      <Shield size={32} className="privacy-header-icon" />
      <h3>سياسة الخصوصية</h3>
      <p>آخر تحديث: مارس 2024</p>
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
      <p>يمكنك تحميل نسخة كاملة من سياسة الخصوصية بصيغة PDF</p>
      <a href="#" className="privacy-download-btn">
        <FileText size={18} />
        تحميل الملف
      </a>
    </div>
  </div>
);


// ── Main Profile component ────────────────────────────────
const Profile: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('account-info');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // --- Form State ---
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  const [originalForm, setOriginalForm] = useState({
    fullName: '',
    email: '',
    phone: ''
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
        const name = data?.profile?.full_name || data?.profile?.name || data?.full_name || data?.name || '';
        const email = data?.user?.email || data?.email || '';
        const phone = data?.profile?.phone || data?.phone || '';
        
        const userData = { fullName: name, email, phone };
        setForm(userData);
        setOriginalForm(userData);
      } catch (err) {
        console.error("Failed to parse user data", err);
      }
    }
  }, []);

  const showAvatar = !['help-center', 'help-center-faq', 'privacy-policy'].includes(activeSection);

  return (
    <div className="profile-page" dir="rtl">
      <h1 className="profile-title">الملف الشخصي</h1>

      <div className="profile-layout">

        {/* ─── Left panel ─── */}
        <div className="profile-main-panel">

          {/* Avatar — hidden for non-form sections */}
          {showAvatar && (
            <div className="avatar-wrapper">
              <div className="avatar-circle">
                <img src="/avatar_placeholder.png" alt="Avatar" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  (e.currentTarget.parentElement as HTMLElement).style.background = '#c8d9ec';
                }} />
              </div>
              <button className="avatar-camera-btn" title="تغيير الصورة">
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
                  placeholder="الاسم بالكامل" 
                  value={form.fullName}
                  onChange={(e) => setForm({...form, fullName: e.target.value})}
                  disabled={!isEditing}
                />
                <span className="pf-icon"><User size={18} /></span>
              </div>
              <div className="pf-input-icon">
                <input 
                  type="email" 
                  placeholder="البريد الالكتروني" 
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  disabled={!isEditing}
                />
                <span className="pf-icon"><Mail size={18} /></span>
              </div>
              <div className="pf-input-icon">
                <input 
                  type="tel" 
                  placeholder="رقم الهاتف" 
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  disabled={!isEditing}
                />
                <span className="pf-icon"><Phone size={18} /></span>
              </div>
              
              {!isEditing ? (
                <button type="button" className="pf-save-btn" onClick={() => setShowPasswordModal(true)}>
                  تعديل البيانات
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="pf-save-btn" disabled={loading} style={{ flex: 1 }}>
                    {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                  <button type="button" className="pf-save-btn" style={{ flex: 1, backgroundColor: '#f44336' }} onClick={() => {
                    setIsEditing(false);
                    setErrorMsg('');
                  }}>
                    إلغاء التعديل
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
                  placeholder="كلمة المرور الحالية" 
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
                  placeholder="كلمة المرور الجديدة" 
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
                  placeholder="تأكيد كلمة المرور" 
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
                  {loading ? 'جاري الإرسال...' : 'نسيت الرقم السري؟'}
                </button>
              </div>

              <button type="submit" className="pf-save-btn" disabled={loading}>
                {loading ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </form>
          )}

          {/* Language selector */}
          {activeSection === 'language' && (
            <form className="profile-form" onSubmit={(e) => e.preventDefault()}>
              <div className="pf-input-icon">
                <select defaultValue="ar">
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
                <span className="pf-icon"><Globe size={18} /></span>
              </div>
              <button type="submit" className="pf-save-btn">حفظ</button>
            </form>
          )}

          {/* Help Center */}
          {activeSection === 'help-center' && <HelpCenter onSectionChange={setActiveSection} />}

          {/* Help Center FAQ */}
          {activeSection === 'help-center-faq' && <FAQSection onSectionChange={setActiveSection} />}

          {/* Customer Service Chat */}
          {activeSection === 'customer-service' && <CustomerServiceChat onSectionChange={setActiveSection} />}

          {/* Privacy Policy */}
          {activeSection === 'privacy-policy' && <PrivacyPolicy />}
        </div>

        {/* ─── Right panel: Settings menu ─── */}
        <div className="profile-settings-panel">

          <div className="settings-section">
            <h3 className="settings-section-title">تعديل الحساب</h3>

            <button
              className={`settings-item ${activeSection === 'account-info' ? 'active' : ''}`}
              onClick={() => setActiveSection('account-info')}
            >
              <ChevronLeft size={16} className="settings-chevron" />
              <span>بيانات الحساب</span>
              <User size={18} className="settings-item-icon" />
            </button>

            <button
              className={`settings-item ${activeSection === 'change-password' ? 'active' : ''}`}
              onClick={() => setActiveSection('change-password')}
            >
              <ChevronLeft size={16} className="settings-chevron" />
              <span>تغيير الرقم السري</span>
              <Lock size={18} className="settings-item-icon" />
            </button>

            <button
              className={`settings-item ${activeSection === 'language' ? 'active' : ''}`}
              onClick={() => setActiveSection('language')}
            >
              <ChevronLeft size={16} className="settings-chevron" />
              <span>اللغة</span>
              <Globe size={18} className="settings-item-icon" />
            </button>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">الدعم الفني والخصوصية</h3>

            <button
              className={`settings-item ${['help-center', 'help-center-faq', 'customer-service'].includes(activeSection) ? 'active' : ''}`}
              onClick={() => setActiveSection('help-center')}
            >
              <ChevronLeft size={16} className="settings-chevron" />
              <span>مركز المساعدة</span>
              <HelpCircle size={18} className="settings-item-icon" />
            </button>

            <button
              className={`settings-item ${activeSection === 'privacy-policy' ? 'active' : ''}`}
              onClick={() => setActiveSection('privacy-policy')}
            >
              <ChevronLeft size={16} className="settings-chevron" />
              <span>سياسة الخصوصية</span>
              <Shield size={18} className="settings-item-icon" />
            </button>

            <button className="settings-item danger" onClick={() => setShowDeleteModal(true)}>
              <ChevronLeft size={16} className="settings-chevron" />
              <span>حذف الحساب</span>
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
            <h3 className="delete-modal-title">هل انت متأكد من حذف الحساب؟</h3>
            <p className="delete-modal-desc" style={{ marginBottom: '15px' }}>
              سيتم حذف جميع بياناتك نهائياً من قاعدة البيانات. يرجى إدخال كلمة المرور للتأكيد.
            </p>
            
            <form onSubmit={handleDeleteAccount}>
              <div className="pf-input-icon" style={{ marginBottom: '20px' }}>
                <input 
                  type={showModalPasswordVisible ? "text" : "password"} 
                  placeholder="كلمة المرور" 
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
                  {modalLoading ? 'جاري الحذف...' : 'حذف نهائياً'}
                </button>
                <button type="button" className="delete-modal-cancel" onClick={() => setShowDeleteModal(false)}>الغاء</button>
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
            <h3 className="delete-modal-title">تأكيد الهوية</h3>
            <p className="delete-modal-desc" style={{ marginBottom: '20px' }}>
              يرجى إدخال كلمة المرور الخاصة بك لتتمكن من تعديل بياناتك.
            </p>
            
            <form onSubmit={handleVerifyPassword}>
              <div className="pf-input-icon" style={{ marginBottom: '20px' }}>
                <input 
                  type={showModalPasswordVisible ? "text" : "password"} 
                  placeholder="كلمة المرور" 
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
                  {modalLoading ? 'جاري التحقق...' : 'تأكيد'}
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
              تم
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
