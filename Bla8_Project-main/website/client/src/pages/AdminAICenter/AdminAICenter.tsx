import { useEffect, useRef, useState } from 'react';
import { Bot, Settings, Clock, Send, ChevronDown, Loader2, Trash2, Plus, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { orgService } from '../../services/orgService';
import './AdminAICenter.css';

/* ─── PDF Export Helper (same smart-slicing algo as AwqafAICenter) ─── */
const generatePDF = async (elementId: string, filename: string = 'تقرير_تحليلي') => {
  const element = document.getElementById(elementId);
  if (!element) return false;
  try {
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let yPos = margin;
    let remainingHeight = imgHeight;
    let sourceY = 0;
    const ctxOriginal = canvas.getContext('2d');

    while (remainingHeight > 0.5) {
      let sliceHeight = Math.min(remainingHeight, pageHeight - yPos - margin);
      let slicePixelHeight = (sliceHeight / imgWidth) * canvas.width;

      if (remainingHeight > sliceHeight && ctxOriginal) {
        const startY = Math.floor(sourceY);
        const searchHeight = Math.min(800, Math.floor(slicePixelHeight * 0.5));
        const searchStartY = Math.max(0, Math.floor(slicePixelHeight - searchHeight));
        const chunkData = ctxOriginal.getImageData(0, startY + searchStartY, canvas.width, searchHeight);
        const data = chunkData.data;
        const rowWidth = canvas.width;
        let safeY = slicePixelHeight;
        for (let y = searchHeight - 1; y >= 0; y--) {
          let isRowBlank = true;
          for (let x = 0; x < rowWidth; x++) {
            const idx = (y * rowWidth + x) * 4;
            if (data[idx + 3] > 0 && (data[idx] < 250 || data[idx + 1] < 250 || data[idx + 2] < 250)) {
              isRowBlank = false;
              break;
            }
          }
          if (isRowBlank) { safeY = searchStartY + y; break; }
        }
        slicePixelHeight = safeY;
        sliceHeight = (slicePixelHeight / canvas.width) * imgWidth;
      }

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = slicePixelHeight;
      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, sourceY, canvas.width, slicePixelHeight, 0, 0, canvas.width, slicePixelHeight);
        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, yPos, imgWidth, sliceHeight);
      }
      remainingHeight -= sliceHeight;
      sourceY += slicePixelHeight;
      if (remainingHeight > 0.5) { pdf.addPage(); yPos = margin; }
    }
    pdf.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
    return true;
  } catch (error) {
    console.error('PDF Generation failed:', error);
    return false;
  }
};

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

const ADMIN_WELCOME_MESSAGE =
  'السلام عليكم! أنا المساعد الذكي لمنصة بلاغ. بصفتك مديراً يمكنني مساعدتك في تحليل البيانات الشاملة للمنصة، مقارنة أداء الجمعيات والدعاة، وتوليد التقارير التنفيذية. ماذا تريد أن تعرف؟';

const REPORT_TYPES = [
  'تقرير شامل عن الجمعيات',
  'تقرير أداء الدعاة',
  'تقرير الطلبات والتدفق',
  'تحليل مؤشرات المنصة',
];

const TIMEFRAME_OPTIONS = [
  { value: 'all_time', label: 'كل الوقت' },
  { value: 'this_month', label: 'هذا الشهر' },
  { value: 'last_month', label: 'الشهر السابق' },
  { value: 'last_3_months', label: 'آخر 3 أشهر' },
  { value: 'last_6_months', label: 'آخر 6 أشهر' },
  { value: 'last_year', label: 'آخر سنة' },
] as const;

const SCHEDULE_TIMING_OPTIONS = [
  'يوميًا - 9:00 صباحًا',
  'أسبوعيًا - الجمعة 4:00 مساءً',
  'شهريًا - اليوم الأول 9:00 صباحًا',
] as const;

const SCHEDULE_DURATION_OPTIONS = [
  { value: '1_month', label: 'لمدة شهر' },
  { value: '3_months', label: 'لمدة 3 أشهر' },
  { value: '6_months', label: 'لمدة 6 أشهر' },
  { value: '1_year', label: 'لمدة سنة' },
] as const;

const normalizeAiContent = (content: string) =>
  content
    // Join broken numeric bullets like: "1.\n**Title**" -> "1. **Title**"
    .replace(/(^|\n)\s*([0-9٠-٩]+)\.\s*\n+\s*/g, '$1$2. ')
    // Collapse excessive empty lines for cleaner rendering
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const AdminAICenter = () => {
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [timeframe, setTimeframe] = useState<'all_time' | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year'>('all_time');
  const [reportLoading, setReportLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportContent, setExportContent] = useState<string | null>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      content: ADMIN_WELCOME_MESSAGE,
    },
  ]);

  const [schedules, setSchedules] = useState<{ id: number; name: string; timing: string; report_type: string }[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [newScheduleReportType, setNewScheduleReportType] = useState(REPORT_TYPES[0]);
  const [newScheduleDuration, setNewScheduleDuration] = useState<(typeof SCHEDULE_DURATION_OPTIONS)[number]['value']>('1_month');
  const [newScheduleTiming, setNewScheduleTiming] = useState<(typeof SCHEDULE_TIMING_OPTIONS)[number]>(SCHEDULE_TIMING_OPTIONS[0]);

  useEffect(() => {
    const el = chatAreaRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const data = await orgService.getAnalyticsChatHistory();
        const history = Array.isArray(data?.history) ? data.history : [];
        setConversationId(typeof data?.conversation_id === 'number' ? data.conversation_id : null);
        if (history.length > 0) {
          setChatMessages(history.map((msg: { role: 'user' | 'ai'; content: string }) => ({ role: msg.role, content: msg.content })));
        } else {
          setChatMessages([{ role: 'ai', content: ADMIN_WELCOME_MESSAGE }]);
        }
      } catch (err) {
        console.error('Failed to load analytics history:', err);
      }
    };
    fetchChatHistory();
  }, []);

  useEffect(() => {
    const fetchSchedules = async () => {
      setSchedulesLoading(true);
      try {
        const data = await orgService.getReportSchedules();
        setSchedules(data);
      } catch (err) {
        console.error('Failed to load schedules:', err);
      } finally {
        setSchedulesLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  const buildReportPrompt = () => {
    const timeframeLabel =
      timeframe === 'all_time' ? 'كل الوقت'
        : timeframe === 'this_month' ? 'هذا الشهر'
          : timeframe === 'last_month' ? 'الشهر السابق'
            : timeframe === 'last_3_months' ? 'آخر 3 أشهر'
              : timeframe === 'last_6_months' ? 'آخر 6 أشهر'
                : 'آخر سنة';

    switch (reportType) {
      case 'تقرير شامل عن الجمعيات':
        return `أنشئ تقريراً شاملاً عن جميع الجمعيات في المنصة للإطار الزمني "${timeframeLabel}". يشمل: عدد الجمعيات النشطة، إجمالي الدعاة، أعلى الجمعيات أداءً، مقارنة شاملة في جدول يوضح (اسم الجمعية، عدد الدعاة، عدد الطلبات، نسبة النجاح، عدد المسلمين الجدد).`;
      case 'تقرير أداء الدعاة':
        return `أنشئ تقرير أداء الدعاة على مستوى المنصة كاملاً للإطار الزمني "${timeframeLabel}". يشمل: أعلى 10 دعاة أداءً، متوسط الاستجابة، توزيع الدعاة حسب الجمعيات، جدول مقارنة يوضح (اسم الداعية، الجمعية، إجمالي الطلبات، المقبولة، نسبة النجاح، عدد المسلمين).`;
      case 'تقرير الطلبات والتدفق':
        return `أنشئ تقرير الطلبات والتدفق الشامل للمنصة للإطار الزمني "${timeframeLabel}". يشمل: إجمالي الطلبات، الطلبات المعلقة والمكتملة والملغاة، متوسط وقت الاستجابة، التدفق الزمني للطلبات، وأكثر المناطق طلباً.`;
      default: // تحليل مؤشرات المنصة
        return `أنشئ تحليلاً شاملاً لمؤشرات المنصة للإطار الزمني "${timeframeLabel}". يشمل: KPIs الرئيسية (إجمالي المستخدمين، المسلمين الجدد، معدل التحويل)، الاتجاهات الزمنية، نقاط القوة والضعف، وتوصيات إدارية واضحة.`;
    }
  };

  const handleCreateReport = async () => {
    const prompt = buildReportPrompt();
    try {
      setReportLoading(true);
      const result = await orgService.sendAssociationAIMessage(prompt, timeframe, conversationId);
      const userMessage = result?.user_message?.content ? { role: 'user' as const, content: result.user_message.content } : { role: 'user' as const, content: prompt };
      const aiMessage = result?.ai_response?.content ? { role: 'ai' as const, content: result.ai_response.content } : { role: 'ai' as const, content: 'تم إرسال طلب إنشاء التقرير للمساعد الذكي.' };
      const nextConversationId = result?.user_message?.conversation_id ?? result?.ai_response?.conversation_id;
      if (typeof nextConversationId === 'number') setConversationId(nextConversationId);
      setChatMessages((prev) => [...prev, userMessage, aiMessage]);
    } catch (err) {
      console.error('Create report error:', err);
      setChatMessages((prev) => [...prev, { role: 'ai', content: 'تعذر إنشاء التقرير حالياً، حاول مرة أخرى.' }]);
    } finally {
      setReportLoading(false);
    }
  };

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    try {
      setChatLoading(true);
      const result = await orgService.sendAssociationAIMessage(text, timeframe, conversationId);
      const userMessage = result?.user_message?.content ? { role: 'user' as const, content: result.user_message.content } : { role: 'user' as const, content: text };
      const aiMessage = result?.ai_response?.content ? { role: 'ai' as const, content: result.ai_response.content } : { role: 'ai' as const, content: 'تعذر الحصول على رد من المساعد.' };
      const nextConversationId = result?.user_message?.conversation_id ?? result?.ai_response?.conversation_id;
      if (typeof nextConversationId === 'number') setConversationId(nextConversationId);
      setChatMessages((prev) => [...prev, userMessage, aiMessage]);
    } catch (err) {
      console.error('Analytics chat error:', err);
      setChatMessages((prev) => [...prev, { role: 'ai', content: 'حدث خطأ أثناء التواصل مع المساعد الذكي.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    const durationLabel = SCHEDULE_DURATION_OPTIONS.find((item) => item.value === newScheduleDuration)?.label ?? 'لمدة شهر';
    const name = `${newScheduleReportType} - ${durationLabel}`;
    const timing = newScheduleTiming;
    try {
      const created = await orgService.addReportSchedule({ name, timing, report_type: newScheduleReportType });
      setSchedules((prev) => [...prev, created]);
      setNewScheduleReportType(REPORT_TYPES[0]);
      setNewScheduleDuration('1_month');
      setNewScheduleTiming(SCHEDULE_TIMING_OPTIONS[0]);
    } catch (err) {
      console.error('Failed to add schedule:', err);
      alert('تعذر إضافة الجدول، حاول مرة أخرى.');
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      await orgService.deleteReportSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      alert('تعذر حذف الجدول، حاول مرة أخرى.');
    }
  };

  const handleExportAIReport = async () => {
    const lastAiMessage = [...chatMessages].reverse().find((m) => m.role === 'ai');
    if (!lastAiMessage) { alert('لا يوجد تقرير لتحميله'); return; }
    setExporting(true);

    const lines = lastAiMessage.content.split('\n');
    let formattedLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.match(/^\s*(\d+\.|[\*\-])\s/)) {
        if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1].trim() !== '') {
          formattedLines.push('');
        }
        line = line.replace(/^\s*[\*\-]\s/, '• ');
      }
      formattedLines.push(line);
    }
    let fixedContent = formattedLines.join('\n');
    fixedContent = fixedContent.replace(/([أ-ية])(\d+)/g, '$1 $2').replace(/(\d+)([أ-ية])/g, '$1 $2');
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    fixedContent = fixedContent.replace(/[0-9]/g, (w) => arabicNumbers[parseInt(w, 10)]);
    setExportContent(fixedContent);

    setTimeout(async () => {
      const filename = reportType.replace(/\s+/g, '_');
      const success = await generatePDF('admin-pdf-template', filename);
      if (!success) alert('حدث خطأ أثناء تحميل التقرير');
      setExportContent(null);
      setExporting(false);
    }, 150);
  };

  return (
    <div className="ai-center-page">
      <div className="ai-breadcrumb-right">التقارير والإحصائيات</div>

      <div className="ai-center-title-area">
        <h1 className="ai-main-title">مركز التقارير الذكية</h1>
      </div>

      <div className="ai-top-grid">
        {/* منشئ التقارير */}
        <div className="ai-card ai-interactive-builder">
          <div className="ai-card-header text-gray">
            <Settings size={20} className="ai-header-icon" />
            <h2>منشئ التقارير التفاعلي</h2>
          </div>
          <div className="ai-form">
            <div className="ai-form-group">
              <label>نوع التقرير</label>
              <div className="ai-select-wrapper">
                <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="ai-select">
                  {REPORT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="ai-select-icon" />
              </div>
            </div>

            <div className="ai-form-group">
              <label>الإطار الزمني</label>
              <div className="ai-select-wrapper">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
                  className="ai-select"
                >
                  {TIMEFRAME_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
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

        {/* المساعد الذكي */}
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
                    ),
                  }}
                >
                  {msg.role === 'ai' ? normalizeAiContent(msg.content) : msg.content}
                </ReactMarkdown>
              </div>
            ))}
            {(chatLoading || reportLoading) && (
              <div className="ai-chat-loading">
                <Loader2 size={16} className="spin-icon" />
                <span>جاري التفكير...</span>
              </div>
            )}
          </div>

          <div className="ai-chat-input-wrapper">
            <div className="ai-chat-input-container">
              <button className="ai-send-btn" onClick={handleSendChat} disabled={chatLoading || reportLoading}>
                <Send size={16} />
              </button>
              <input
                type="text"
                placeholder="اطرح سؤالاً حول بيانات المنصة..."
                className="ai-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* جدولة التقارير */}
      <div className="ai-card ai-scheduler-section">
        <div className="ai-card-header text-gray">
          <Clock size={20} className="ai-header-icon" />
          <h2>جدولة التقارير التلقائية</h2>
        </div>
        <p className="ai-subtitle">إعداد التقارير ليتم إنشاؤها وإرسالها تلقائياً</p>

        <div className="ai-schedule-list">
          {schedulesLoading && <p style={{ textAlign: 'center', color: '#888' }}>جاري التحميل...</p>}
          {!schedulesLoading && schedules.length === 0 && (
            <p style={{ textAlign: 'center', color: '#aaa' }}>لا توجد جداول مضافة بعد.</p>
          )}
          {schedules.map((item) => (
            <div className="ai-schedule-item" key={item.id}>
              <span className="ai-schedule-text">{item.name} — {item.timing}</span>
              <button className="ai-btn-trash" onClick={() => handleDeleteSchedule(item.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="ai-schedule-add">
          <div className="ai-select-wrapper">
            <select
              value={newScheduleReportType}
              onChange={(e) => setNewScheduleReportType(e.target.value)}
              className="ai-select"
            >
              {REPORT_TYPES.map((item) => (
                <option key={`schedule-report-${item}`} value={item}>{item}</option>
              ))}
            </select>
            <ChevronDown size={16} className="ai-select-icon" />
          </div>
          <div className="ai-select-wrapper">
            <select
              value={newScheduleDuration}
              onChange={(e) => setNewScheduleDuration(e.target.value as typeof newScheduleDuration)}
              className="ai-select"
            >
              {SCHEDULE_DURATION_OPTIONS.map((item) => (
                <option key={`schedule-duration-${item.value}`} value={item.value}>{item.label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="ai-select-icon" />
          </div>
          <div className="ai-select-wrapper">
            <select
              value={newScheduleTiming}
              onChange={(e) => setNewScheduleTiming(e.target.value as (typeof SCHEDULE_TIMING_OPTIONS)[number])}
              className="ai-select"
            >
              {SCHEDULE_TIMING_OPTIONS.map((item) => (
                <option key={`schedule-timing-${item}`} value={item}>{item}</option>
              ))}
            </select>
            <ChevronDown size={16} className="ai-select-icon" />
          </div>
          <button className="ai-btn-primary" onClick={handleAddSchedule}>
            <Plus size={16} /> إضافة
          </button>
        </div>
      </div>

      {/* ─── PDF Export Template (Hidden) ─── */}
      {exportContent && (
        <div id="admin-pdf-template" className="pdf-export-wrapper" dir="rtl">
          <div className="pdf-export-header">
            <h1 className="pdf-export-title">{reportType}</h1>
            <div className="pdf-export-date">
              {new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="pdf-export-divider"></div>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{exportContent}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default AdminAICenter;
