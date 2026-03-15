import React, { useState } from 'react';
import {
  User, BookOpen, Flag, Languages, Phone,
  Calendar, Users, ClipboardList, ChevronDown, MessageSquare
} from 'lucide-react';
import Input from '../../components/common/Input/Input';
import Checkbox from '../../components/common/Checkbox/Checkbox';
import './MuslimCallerDashboard.css';

/* ── Reusable Select Field ──────────────────────────────────────── */
const SelectField: React.FC<{
  name: string;
  placeholder: string;
  icon: React.ReactNode;
  options: { value: string; label: string }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}> = ({ name, placeholder, icon, options, value, onChange }) => (
  <div className="mc-select-wrapper">
    <span className="mc-sel-icon">{icon}</span>
    <select name={name} className="mc-select" value={value} onChange={onChange}>
      <option value="" disabled hidden>{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <span className="mc-sel-chevron"><ChevronDown size={15} /></span>
  </div>
);

/* ── Main Component ─────────────────────────────────────────────── */
const MuslimCallerDashboard: React.FC = () => {
  const [form, setForm] = useState({
    fullName: '', religion: '', nationality: '', language: '',
    phone: '', gender: '', age: '', communicationMethod: '',
    comment: '', acceptedTerms: false,
  });

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('تم الإرسال بنجاح ✅');
  };

  return (
    <div className="mc-page" dir="rtl">
      <div className="mc-card">

        {/* Logo */}
        <div className="mc-logo-area">
          <img src="/bla8_logo.png" alt="Balagh Logo" className="mc-logo" />
        </div>

        <h2 className="mc-title">من فضلك قم بملئ البيانات المدعو</h2>

        <form className="mc-form" onSubmit={submit}>

          {/* Full Name */}
          <Input
            type="text" name="fullName" placeholder="الاسم بالكامل"
            icon={<User size={18} />} value={form.fullName} onChange={handle}
          />

          {/* Row: Religion + Nationality */}
          <div className="mc-row">
            <SelectField name="nationality" placeholder="الجنسية" icon={<Flag size={18} />}
              value={form.nationality} onChange={handle}
              options={[{ value: 'kw', label: 'كويتي' }, { value: 'eg', label: 'مصري' },
                        { value: 'sa', label: 'سعودي' }, { value: 'other', label: 'أخرى' }]}
            />
            <SelectField name="religion" placeholder="الديانة" icon={<BookOpen size={18} />}
              value={form.religion} onChange={handle}
              options={[{ value: 'muslim', label: 'مسلم' }, { value: 'christian', label: 'مسيحي' },
                        { value: 'jewish', label: 'يهودي' }, { value: 'other', label: 'أخرى' }]}
            />
          </div>

          {/* Language */}
          <SelectField name="language" placeholder="اللغة" icon={<Languages size={18} />}
            value={form.language} onChange={handle}
            options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'الإنجليزية' },
                      { value: 'fr', label: 'الفرنسية' }, { value: 'ur', label: 'الأردية' }]}
          />

          {/* Phone */}
          <Input
            type="tel" name="phone" placeholder="رقم الهاتف"
            icon={<Phone size={18} />} value={form.phone} onChange={handle}
          />

          {/* Row: Age + Gender */}
          <div className="mc-row">
            <Input
              type="text" name="age" placeholder="العمر"
              icon={<Calendar size={18} />} value={form.age} onChange={handle}
            />
            <SelectField name="gender" placeholder="الجنس" icon={<Users size={18} />}
              value={form.gender} onChange={handle}
              options={[{ value: 'male', label: 'ذكر' }, { value: 'female', label: 'أنثى' }]}
            />
          </div>

          {/* Communication Method */}
          <SelectField name="communicationMethod" placeholder="وسيلة تواصل" icon={<ClipboardList size={18} />}
            value={form.communicationMethod} onChange={handle}
            options={[{ value: 'whatsapp', label: 'واتساب' }, { value: 'phone', label: 'مكالمة هاتفية' },
                      { value: 'telegram', label: 'تيليغرام' }, { value: 'messenger', label: 'ماسنجر' }]}
          />

          {/* Comment */}
          <div className="mc-textarea-wrapper">
            <MessageSquare size={16} className="mc-ta-icon" />
            <textarea
              name="comment" placeholder="أضف تعليق"
              className="mc-textarea" value={form.comment} onChange={handle}
            />
          </div>

          {/* Checkbox */}
          <div className="mc-check-row">
            <Checkbox
              label="الشخص يعلم بادخال بياناته الشخصية"
              checked={form.acceptedTerms}
              onChange={e => setForm(p => ({ ...p, acceptedTerms: e.target.checked }))}
            />
          </div>

          <button type="submit" className="mc-btn-submit">إرسال</button>
        </form>
      </div>
    </div>
  );
};

export default MuslimCallerDashboard;
