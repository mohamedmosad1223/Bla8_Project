import { useState } from 'react';
import { Bot, Settings, Clock, Send, Trash2, ChevronDown } from 'lucide-react';
import './AwqafAICenter.css';

const AwqafAICenter = () => {
  const [reportType, setReportType] = useState('أداء ومقارنة الجمعيات');
  const [timeframe, setTimeframe] = useState('أخر 30 يوماً');
  const [filter, setFilter] = useState('الكل');

  return (
    <div className="ai-center-page">
      <div className="ai-breadcrumb-right">الذكاء الاصطناعي</div>
      
      <div className="ai-center-title-area">
        <h1 className="ai-main-title">مركز التقارير الذكية</h1>
      </div>

      <div className="ai-top-grid">
        {/* Right side in RTL (Visually right because of flex row in RTL) */}
        <div className="ai-card ai-interactive-builder">
          <div className="ai-card-header text-gray">
            <Settings size={20} className="ai-header-icon" />
            <h2>منشئ التقارير التفاعلي</h2>
          </div>
          <div className="ai-form">
            <div className="ai-form-group">
              <label>نوع التقرير</label>
              <div className="ai-select-wrapper">
                <select value={reportType} onChange={e => setReportType(e.target.value)} className="ai-select">
                  <option>أداء ومقارنة الجمعيات</option>
                  <option>تقرير استجابة الدعاة</option>
                </select>
                <ChevronDown size={16} className="ai-select-icon" />
              </div>
            </div>
            
            <div className="ai-form-group">
              <label>الإطار الزمني</label>
              <div className="ai-select-wrapper">
                <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="ai-select">
                  <option>أخر 30 يوماً</option>
                  <option>أخر 7 أيام</option>
                </select>
                <ChevronDown size={16} className="ai-select-icon" />
              </div>
            </div>

            <div className="ai-form-group">
              <label>فلتر حسب (اختياري)</label>
              <div className="ai-select-wrapper">
                <select value={filter} onChange={e => setFilter(e.target.value)} className="ai-select">
                  <option>الكل</option>
                  <option>محافظة العاصمة</option>
                </select>
                <ChevronDown size={16} className="ai-select-icon" />
              </div>
            </div>

            <div className="ai-form-actions">
              <button className="ai-btn-primary">إنشاء التقرير</button>
            </div>
          </div>
        </div>

        {/* Left side in RTL */}
        <div className="ai-card ai-smart-assistant">
          <div className="ai-card-header text-blue">
            <Bot size={20} className="ai-header-icon" />
            <h2>المساعد الذكي - أسال عن بيانات منصة بلاغ</h2>
          </div>
          <div className="ai-chat-area">
            <div className="ai-chat-bubble">
              السلام عليكم! أنا المساعد الذكي لمنصة بلاغ. يمكنني مساعدتك في تحليل بيانات المنصة، وتوليد التقارير، والإجابة عن أسئلتك حول الاتجاهات. ماذا تريد أن تعرف؟
            </div>
          </div>
          <div className="ai-chat-input-wrapper">
            <div className="ai-chat-input-container">
              <button className="ai-send-btn">
                <Send size={16} />
              </button>
              <input 
                type="text" 
                placeholder="اطرح سؤالا حول بيانات منصة بلاغ..." 
                className="ai-chat-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="ai-card ai-scheduler-section">
        <div className="ai-card-header text-gray">
          <Clock size={20} className="ai-header-icon" />
          <h2>جدولة التقارير التلقائية</h2>
        </div>
        <p className="ai-subtitle">إعداد التقارير ليتم إنشاؤها وإرسالها تلقائياً</p>

        <div className="ai-schedule-list">
          <div className="ai-schedule-item">
            <span className="ai-schedule-text">الملخص التنفيذي الشهري - كل أول يوم من الشهر الساعة 9 صباحاً</span>
            <button className="ai-btn-trash"><Trash2 size={18} /></button>
          </div>
          <div className="ai-schedule-item">
            <span className="ai-schedule-text">تقرير الكفاءة الأسبوعي - كل يوم جمعة الساعة 4 مساءً</span>
            <button className="ai-btn-trash"><Trash2 size={18} /></button>
          </div>
        </div>

        <div className="ai-form-actions">
          <button className="ai-btn-primary">+ إضافة جدولة جديدة</button>
        </div>
      </div>
    </div>
  );
};

export default AwqafAICenter;
