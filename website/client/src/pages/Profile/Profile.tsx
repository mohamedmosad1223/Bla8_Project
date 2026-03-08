import React, { useState } from 'react';
import { User, Mail, Phone, ChevronLeft, Edit3, Lock, Globe, HelpCircle, Shield, Trash2, Camera, Plus, Minus } from 'lucide-react';
import './Profile.css';

type ActiveSection = 'account-info' | 'change-password' | 'language' | 'help-center' | 'privacy-policy';

// ── FAQ data ──────────────────────────────────────────────
const faqs = [
  { q: 'سؤال هنا', a: 'إليكم نموذجاً قد تجيب على سؤال شائع أو تُقدّم نصائح مفيدة. عمرني هدوراً رائع. كسساءات الربيع الجميلة التي أستمع بها من كل فأس.' },
  { q: 'سؤال هنا', a: 'إليكم نموذجاً قد تجيب على سؤال شائع أو تُقدّم نصائح مفيدة. عمرني هدوراً رائع. كسساءات الربيع الجميلة التي أستمع بها من كل فأس.' },
  { q: 'سؤال هنا', a: null },
  { q: 'سؤال هنا', a: null },
  { q: 'سؤال هنا', a: 'إليكم نموذجاً قد تجيب على سؤال شائع أو تُقدّم نصائح مفيدة. عمرني هدوراً رائع. كسساءات الربيع الجميلة التي أستمع بها من كل فأس.' },
];

// ── Privacy sections ──────────────────────────────────────
const privacySections = Array(5).fill({
  title: 'معلومات هنا',
  body: 'نقوم بجمع معلومات مثل أسماء قائد الفريق وأعضاء الفريق وتفاصيل الاتصال وسجلات التفتيش لتسهيل إدارة سلامة مكافحة الحرائق.',
});

// ── Help Center accordion ─────────────────────────────────
const HelpCenter: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(1);
  return (
    <div className="help-center-content" dir="rtl">
      <p className="help-intro">هل لديك أي أسئلة؟ اقرأ الأسئلة الشائعة أدناه أو ابحث عن إجابة لأسئلتك.</p>
      <div className="faq-list">
        {faqs.map((item, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} className="faq-item">
              <button className="faq-toggle" onClick={() => setOpenIdx(isOpen ? null : i)}>
                {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                <span>{item.q}</span>
              </button>
              {isOpen && item.a && <p className="faq-answer">{item.a}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Privacy Policy ────────────────────────────────────────
const PrivacyPolicy: React.FC = () => (
  <div className="privacy-content" dir="rtl">
    <p className="privacy-download">
      قم بتنزيل سياسة الخصوصية بصيغة PDF <a href="#" className="privacy-link">هنا</a>.
    </p>
    <ul className="privacy-list">
      {privacySections.map((sec, i) => (
        <li key={i} className="privacy-section">
          <strong>• {sec.title}</strong>
          <p>{sec.body}</p>
        </li>
      ))}
    </ul>
  </div>
);

// ── Main Profile component ────────────────────────────────
const Profile: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('account-info');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const showAvatar = !['help-center', 'privacy-policy'].includes(activeSection);

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
          {activeSection === 'help-center' && <HelpCenter />}

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
              <Edit3 size={18} className="settings-item-icon" />
            </button>

            <button
              className={`settings-item ${activeSection === 'change-password' ? 'active' : ''}`}
              onClick={() => setActiveSection('change-password')}
            >
              <ChevronLeft size={16} className="settings-chevron" />
              <span>تغيير الرقم السري</span>
              <Edit3 size={18} className="settings-item-icon" />
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
              className={`settings-item ${activeSection === 'help-center' ? 'active' : ''}`}
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
