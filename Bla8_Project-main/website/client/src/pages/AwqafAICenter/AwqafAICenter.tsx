import { useEffect, useRef, useState } from 'react';
import { Bot, Settings, Clock, Send, ChevronDown, Loader2, Trash2, Plus, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ministerService } from '../../services/ministerService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './AwqafAICenter.css';

interface OrgOption {
  org_id: number;
  organization_name: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

const AwqafAICenter = () => {
  const [reportType, setReportType] = useState('أداء ومقارنة الجمعيات');
  const [timeframe, setTimeframe] = useState<'all_time' | 'this_month' | 'last_month'>('all_time');
  const [filter, setFilter] = useState('all');
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      content: 'السلام عليكم! أنا المساعد الذكي لمنصة بلاغ. يمكنني مساعدتك في تحليل بيانات المنصة، وتوليد التقارير، والإجابة عن أسئلتك حول الاتجاهات. ماذا تريد أن تعرف؟'
    }
  ]);

  const [schedules, setSchedules] = useState<string[]>([
    'الملخص التنفيذي الشهري - كل أول يوم من الشهر الساعة 9 صباحاً',
    'تقرير الكفاءة الأسبوعي - كل يوم جمعة الساعة 4 مساءً'
  ]);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('');

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const result = await ministerService.getOrganizations();
        const options = (Array.isArray(result) ? result : []).map((org: any) => ({
          org_id: org.org_id,
          organization_name: org.organization_name
        }));
        setOrganizations(options);
      } catch (err) {
        console.error('Organizations fetch error:', err);
      }
    };
    fetchOrganizations();
  }, []);

  useEffect(() => {
    const el = chatAreaRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chatMessages, chatLoading]);

  const handleCreateReport = async () => {
    const timeframeLabel =
      timeframe === 'all_time' ? 'كل الوقت' : timeframe === 'this_month' ? 'هذا الشهر' : 'الشهر السابق';

    let builtPrompt = '';

    if (reportType === 'أداء ومقارنة الجمعيات') {
      if (filter === 'all') {
        builtPrompt = `أنشئ تقرير أداء ومقارنة الجمعيات للإطار الزمني ${timeframeLabel} مع فلتر "كل الجمعيات"، واعرض أهم 5 مؤشرات ونقاط التحسين لكل جهة في جدول مقارنة شامل.`;
      } else if (filter === '0') {
        builtPrompt = `أنشئ أداء ومقارنة بين الدعاه للإطار الزمني ${timeframeLabel} مع فلتر "الدعاة المنفردين" (المتطوعين)، واعرض أهم 5 مؤشرات ونقاط التحسين مع توضيح اسم الداعية وتفاصيل أدائه.`;
      } else {
        const orgName = organizations.find((org) => String(org.org_id) === filter)?.organization_name || 'جمعية محددة';
        builtPrompt = `أنشئ أداء ومقارنة الجمعيات للإطار الزمني ${timeframeLabel} مع فلتر الجمعيات باسم "${orgName}"، واعرض أهم 5 مؤشرات ونقاط التحسين. مع عرض بيانات هذه الجمعية فقط في الجدول.`;
      }
    } else {
      // Logic for 'تقرير استجابة الدعاة' (Preacher Response Report)
      if (filter === 'all') {
        builtPrompt = `أنشئ تقرير استجابة الدعاة للإطار الزمني ${timeframeLabel} لجميع الدعاة في المنصة، واعرض جدولاً يوضح لكل داعية: اسمه، الجمعية التابع لها، عدد الطلبات، ونسبة النجاح.`;
      } else if (filter === '0') {
        builtPrompt = `أنشئ تقرير استجابة الدعاة للإطار الزمني ${timeframeLabel} لجميع "الدعاة المنفردين" (المتطوعين) فقط، واعرض جدولاً يوضح لكل داعية: اسمه، عدد الطلبات، وعدد الذين أسلموا.`;
      } else {
        const orgName = organizations.find((org) => String(org.org_id) === filter)?.organization_name || 'جمعية محددة';
        // USE THE SUCCESSFUL TEMPLATE FOUND BY THE USER
        builtPrompt = `أريد تقرير شامل عن "${orgName}" يشمل دعاتها بشكل كامل للإطار الزمني ${timeframeLabel}، مع عرض جدول يوضح (اسم الداعية، الحالة، إجمالي الطلبات، عدد المسلمين، ونسبة النجاح).`;
      }
    }

    setChatMessages((prev) => [...prev, { role: 'user', content: builtPrompt }]);
    try {
      setReportLoading(true);
      const result = await ministerService.sendAnalyticsAIMessage(builtPrompt);
      const aiText = result?.ai_response?.content || 'تم إرسال طلب إنشاء التقرير للمساعد الذكي.';
      setChatMessages((prev) => [...prev, { role: 'ai', content: aiText }]);
    } catch (err) {
      console.error('Create report error:', err);
      setChatMessages((prev) => [...prev, { role: 'ai', content: 'تعذر إنشاء التقرير حالياً، حاول مرة أخرى.' }]);
    } finally {
      setReportLoading(false);
    }
  };

  const handleAddSchedule = () => {
    const name = newScheduleName.trim();
    const timing = newScheduleTime.trim();
    if (!name || !timing) return;
    setSchedules((prev) => [...prev, `${name} - ${timing}`]);
    setNewScheduleName('');
    setNewScheduleTime('');
  };

  const handleDeleteSchedule = (index: number) => {
    setSchedules((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: text }]);
    try {
      setChatLoading(true);
      const result = await ministerService.sendAnalyticsAIMessage(text);
      const aiText = result?.ai_response?.content || 'تعذر الحصول على رد من المساعد.';
      setChatMessages((prev) => [...prev, { role: 'ai', content: aiText }]);
    } catch (err) {
      console.error('Analytics chat error:', err);
      setChatMessages((prev) => [...prev, { role: 'ai', content: 'حدث خطأ أثناء التواصل مع المساعد الذكي.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleExportAIReport = async () => {
    if (!chatAreaRef.current) return;
    setExporting(true);
    
    // Remember original styles to restore later
    const originalOverflow = chatAreaRef.current.style.overflow;
    const originalHeight = chatAreaRef.current.style.height;
    const originalMaxHeight = chatAreaRef.current.style.maxHeight;

    try {
      // Temporarily expand container to capture full scrollable content
      chatAreaRef.current.style.overflow = 'visible';
      chatAreaRef.current.style.height = 'auto';
      chatAreaRef.current.style.maxHeight = 'none';

      const canvas = await html2canvas(chatAreaRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Header bar (Indigo color to match AI theme)
      pdf.setFillColor(67, 56, 202); 
      pdf.rect(0, 0, pageWidth, 18, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.text(`تقرير المساعد الذكي - منصة بلاغ`, pageWidth - margin, 12, { align: 'right' });

      // Date
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      const now = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
      pdf.text(now, margin, 12);

      // Page content (screenshot)
      let yPos = 22;
      let remainingHeight = imgHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        const sliceHeight = Math.min(remainingHeight, pageHeight - yPos - margin);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = (sliceHeight / imgWidth) * canvas.width;
        const ctx = sliceCanvas.getContext('2d')!;
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, yPos, imgWidth, sliceHeight);
        remainingHeight -= sliceHeight;
        sourceY += sliceCanvas.height;
        if (remainingHeight > 0) {
          pdf.addPage();
          yPos = margin;
        }
      }

      // Footer
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`صفحة ${i} من ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      }

      pdf.save(`تقرير-المساعد-الذكي.pdf`);
    } finally {
      // Restore styles to enable scrolling again
      chatAreaRef.current.style.overflow = originalOverflow;
      chatAreaRef.current.style.height = originalHeight;
      chatAreaRef.current.style.maxHeight = originalMaxHeight;
      setExporting(false);
    }
  };

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
                <select value={timeframe} onChange={e => setTimeframe(e.target.value as 'all_time' | 'this_month' | 'last_month')} className="ai-select">
                  <option value="all_time">كل الوقت</option>
                  <option value="this_month">هذا الشهر</option>
                  <option value="last_month">الشهر السابق</option>
                </select>
                <ChevronDown size={16} className="ai-select-icon" />
              </div>
            </div>

            <div className="ai-form-group">
              <label>فلتر حسب (اختياري)</label>
              <div className="ai-select-wrapper">
                <select value={filter} onChange={e => setFilter(e.target.value)} className="ai-select">
                  <option value="all">الكل</option>
                  <option value="0">الدعاة المتعاونين</option>
                  {organizations.map((org) => (
                    <option key={org.org_id} value={String(org.org_id)}>{org.organization_name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="ai-select-icon" />
              </div>
            </div>

            <div className="ai-form-actions">
              <button className="ai-btn-primary" onClick={handleCreateReport} disabled={reportLoading}>
                {reportLoading ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
              </button>
            </div>
          </div>
        </div>

        {/* Left side in RTL */}
        <div className="ai-card ai-smart-assistant">
          <div className="ai-card-header text-blue" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} className="ai-header-icon" />
              <h2 style={{ margin: 0 }}>المساعد الذكي - التقرير</h2>
            </div>
            <button 
              className="ai-btn-primary" 
              onClick={handleExportAIReport} 
              disabled={exporting || chatMessages.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
            >
              {exporting ? <Loader2 size={14} className="spin-icon" /> : <Download size={14} />}
              {exporting ? 'جاري التحميل...' : 'تحميل التقرير'}
            </button>
          </div>
          <div className="ai-chat-area" ref={chatAreaRef} style={{ backgroundColor: '#fff' }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`ai-chat-bubble ${msg.role === 'user' ? 'user' : ''}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ ...props }) => (
                      <div className="markdown-table-wrapper">
                        <table {...props} />
                      </div>
                    )
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            ))}
            {chatLoading && (
              <div className="ai-chat-loading">
                <Loader2 size={16} className="spin-icon" />
                <span>جاري التفكير...</span>
              </div>
            )}
          </div>
          <div className="ai-chat-input-wrapper">
            <div className="ai-chat-input-container">
              <button className="ai-send-btn" onClick={handleSendChat} disabled={chatLoading}>
                <Send size={16} />
              </button>
              <input
                type="text"
                placeholder="اطرح سؤالا حول بيانات منصة بلاغ..."
                className="ai-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendChat();
                }}
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
          {schedules.map((item, idx) => (
            <div className="ai-schedule-item" key={idx}>
              <span className="ai-schedule-text">{item}</span>
              <button className="ai-btn-trash" onClick={() => handleDeleteSchedule(idx)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="ai-schedule-add">
          <input
            className="ai-chat-input"
            placeholder="اسم الجدولة"
            value={newScheduleName}
            onChange={(e) => setNewScheduleName(e.target.value)}
          />
          <input
            className="ai-chat-input"
            placeholder="الموعد (مثال: كل جمعة 4 مساءً)"
            value={newScheduleTime}
            onChange={(e) => setNewScheduleTime(e.target.value)}
          />
          <button className="ai-btn-primary" onClick={handleAddSchedule}>
            <Plus size={16} /> إضافة
          </button>
        </div>
      </div>
    </div>
  );
};

export default AwqafAICenter;
