import React, { useState } from 'react';
import { User, Mail, Phone, ChevronLeft, ChevronRight, Lock, Globe, HelpCircle, Shield, Trash2, Camera, MessageSquare, PhoneCall, HelpCircle as HelpIcon, Search, Plus, Minus, FileText, Send, Image as ImageIcon } from 'lucide-react';
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
            <form className="profile-form" onSubmit={(e) => e.preventDefault()}>
              <div className="pf-input-icon">
                <input type="text" placeholder="الاسم بالكامل" />
                <span className="pf-icon"><User size={18} /></span>
              </div>
              <div className="pf-input-icon">
                <input type="email" placeholder="البريد الالكتروني" />
                <span className="pf-icon"><Mail size={18} /></span>
              </div>
              <div className="pf-input-icon">
                <input type="tel" placeholder="رقم الهاتف" />
                <span className="pf-icon"><Phone size={18} /></span>
              </div>
              <button type="submit" className="pf-save-btn">حفظ</button>
            </form>
          )}

          {/* Change password form */}
          {activeSection === 'change-password' && (
            <form className="profile-form" onSubmit={(e) => e.preventDefault()}>
              <div className="pf-input-icon">
                <input type="password" placeholder="كلمة المرور الحالية" />
                <span className="pf-icon"><Lock size={18} /></span>
              </div>
              <div className="pf-input-icon">
                <input type="password" placeholder="كلمة المرور الجديدة" />
                <span className="pf-icon"><Lock size={18} /></span>
              </div>
              <div className="pf-input-icon">
                <input type="password" placeholder="تأكيد كلمة المرور" />
                <span className="pf-icon"><Lock size={18} /></span>
              </div>
              <button type="submit" className="pf-save-btn">حفظ</button>
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
            <button className="delete-modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            <h3 className="delete-modal-title">هل انت متأكد من حذف الحساب</h3>
            <p className="delete-modal-desc">يرجى التأكيد على أنك تريد حذف حسابك.</p>
            <div className="delete-modal-actions">
              <button className="delete-modal-confirm">حذف</button>
              <button className="delete-modal-cancel" onClick={() => setShowDeleteModal(false)}>الغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
