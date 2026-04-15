import { useEffect, useRef, useState } from 'react';
import { Bot, Settings, Clock, Send, ChevronDown, Loader2, Trash2, Plus, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { orgService } from '../../services/orgService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../AwqafAICenter/AwqafAICenter.css';

const generatePDF = async (elementId: string, filename: string = 'تقرير_تحليلي') => {
  const element = document.getElementById(elementId);
  if (!element) return false;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

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
            const r = data[idx]; const g = data[idx + 1]; const b = data[idx + 2]; const a = data[idx + 3];
            if (a > 0 && (r < 250 || g < 250 || b < 250)) {
              isRowBlank = false;
              break;
            }
          }
          if (isRowBlank) {
            safeY = searchStartY + y;
            break;
          }
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

      if (remainingHeight > 0.5) {
        pdf.addPage();
        yPos = margin;
      }
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

const ASSOCIATION_WELCOME_MESSAGE =
  'السلام عليكم! أنا المساعد الذكي لمنصة بلاغ. يمكنني مساعدتك في تحليل بيانات جمعيتك، وتوليد التقارير، والإجابة عن أسئلتك. ماذا تريد أن تعرف؟';

const REPORT_TYPES = ['أداء الدعاة', 'تقرير الطلبات', 'تقرير المحادثات'] as const;

const TIMEFRAME_OPTIONS = [
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

const normalizeAiContent = (content: string) =>
  content
    .replace(/(^|\n)\s*([0-9٠-٩]+)\.\s*\n+\s*/g, '$1$2. ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const AssociationAICenter = () => {
  const [reportType, setReportType] = useState<(typeof REPORT_TYPES)[number]>('أداء الدعاة');
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAME_OPTIONS)[number]['value']>('this_month');
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
      content: ASSOCIATION_WELCOME_MESSAGE
    }
  ]);

  const [schedules, setSchedules] = useState<string[]>([
    'تقرير أداء الدعاة الشهري - كل أول يوم من الشهر الساعة 9 صباحاً',
    'ملخص الطلبات الأسبوعي - كل يوم جمعة الساعة 4 مساءً'
  ]);
  const [newScheduleReportType, setNewScheduleReportType] = useState<(typeof REPORT_TYPES)[number]>(REPORT_TYPES[0]);
  const [newScheduleTimeframe, setNewScheduleTimeframe] = useState<(typeof TIMEFRAME_OPTIONS)[number]['value']>('this_month');
  const [newScheduleTiming, setNewScheduleTiming] = useState<(typeof SCHEDULE_TIMING_OPTIONS)[number]>(SCHEDULE_TIMING_OPTIONS[0]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const data = await orgService.getAnalyticsChatHistory();
        const history = Array.isArray(data?.history) ? data.history : [];
        setConversationId(typeof data?.conversation_id === 'number' ? data.conversation_id : null);
        if (history.length > 0) {
          setChatMessages(history.map((msg: { role: 'user' | 'ai'; content: string }) => ({ role: msg.role, content: msg.content })));
        } else {
          setChatMessages([{ role: 'ai', content: ASSOCIATION_WELCOME_MESSAGE }]);
        }
      } catch (err) {
        console.error('Failed to load analytics history:', err);
      }
    };
    fetchChatHistory();
  }, []);

  useEffect(() => {
    const el = chatAreaRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chatMessages, chatLoading]);

  const handleCreateReport = async () => {
    const timeframeLabel = TIMEFRAME_OPTIONS.find((item) => item.value === timeframe)?.label ?? timeframe;

    let builtPrompt = '';

    if (reportType === 'أداء الدعاة') {
      builtPrompt = `أنشئ تقرير أداء شامل لدعاة الجمعية للإطار الزمني ${timeframeLabel}، واعرض جدولاً يوضح لكل داعية: اسمه، الحالة، إجمالي الطلبات، عدد المسلمين الجدد، ونسبة النجاح.`;
    } else if (reportType === 'تقرير الطلبات') {
      builtPrompt = `أنشئ تقرير مفصل عن طلبات الدعوة في الجمعية للإطار الزمني ${timeframeLabel}، ويشمل: عدد الطلبات الجديدة، الطلبات الحالية، الطلبات المكتملة، ومتوسط وقت الاستجابة.`;
    } else if (reportType === 'تقرير المحادثات') {
      builtPrompt = `أنشئ تقرير تحليلي عن المحادثات في الجمعية للإطار الزمني ${timeframeLabel}، يتضمن: عدد المحادثات، الجنسيات الأكثر تفاعلاً، ومعدل التحويل إلى الإسلام.`;
    }

    try {
      setReportLoading(true);
      const result = await orgService.sendAssociationAIMessage(builtPrompt, timeframe, conversationId);
      const userMessage = result?.user_message?.content ? { role: 'user' as const, content: result.user_message.content } : { role: 'user' as const, content: builtPrompt };
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

  const handleAddSchedule = () => {
    const timeframeLabel = TIMEFRAME_OPTIONS.find((item) => item.value === newScheduleTimeframe)?.label ?? 'هذا الشهر';
    const name = `${newScheduleReportType} - ${timeframeLabel}`;
    const timing = newScheduleTiming;
    setSchedules((prev) => [...prev, `${name} - ${timing}`]);
    setNewScheduleReportType(REPORT_TYPES[0]);
    setNewScheduleTimeframe('this_month');
    setNewScheduleTiming(SCHEDULE_TIMING_OPTIONS[0]);
  };

  const handleDeleteSchedule = (index: number) => {
    setSchedules((prev) => prev.filter((_, idx) => idx !== index));
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
      console.error('Association AI chat error:', err);
      setChatMessages((prev) => [...prev, { role: 'ai', content: 'حدث خطأ أثناء التواصل مع المساعد الذكي.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleExportAIReport = async () => {
    const lastAiMessage = [...chatMessages].reverse().find(m => m.role === 'ai');
    if (!lastAiMessage) {
      alert('لا يوجد تقرير لتحميله');
      return;
    }

    setExporting(true);

    const lines = lastAiMessage.content.split('\n');
    const formattedLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.match(/^\s*(\d+\.|[*-])\s/)) {
        if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1].trim() !== '') {
          formattedLines.push('');
        }
        line = line.replace(/^\s*[*-]\s/, '• ');
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
      const success = await generatePDF('association-pdf-template', filename);
      if (!success) {
        alert('حدث خطأ أثناء تحميل التقرير');
      }
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
        {/* Report Builder */}
        <div className="ai-card ai-interactive-builder">
          <div className="ai-card-header text-gray">
            <Settings size={20} className="ai-header-icon" />
            <h2>منشئ التقارير التفاعلي</h2>
          </div>
          <div className="ai-form">
            <div className="ai-form-group">
              <label>نوع التقرير</label>
              <div className="ai-select-wrapper">
                <select value={reportType} onChange={e => setReportType(e.target.value as (typeof REPORT_TYPES)[number])} className="ai-select">
                  {REPORT_TYPES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="ai-select-icon" />
              </div>
            </div>

            <div className="ai-form-group">
              <label>الإطار الزمني</label>
              <div className="ai-select-wrapper">
                <select value={timeframe} onChange={e => setTimeframe(e.target.value as (typeof TIMEFRAME_OPTIONS)[number]['value'])} className="ai-select">
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

        {/* Smart Assistant Chat */}
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
                  {msg.role === 'ai' ? normalizeAiContent(msg.content) : msg.content}
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
                placeholder="اطرح سؤالاً حول بيانات جمعيتك..."
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

      {/* Scheduler Section */}
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

        <div className="ai-schedule-add ai-schedule-add--four">
          <div className="ai-select-wrapper">
            <select
              value={newScheduleReportType}
              onChange={(e) => setNewScheduleReportType(e.target.value as (typeof REPORT_TYPES)[number])}
              className="ai-select"
            >
              {REPORT_TYPES.map((item) => (
                <option key={`assoc-schedule-report-${item}`} value={item}>{item}</option>
              ))}
            </select>
            <ChevronDown size={16} className="ai-select-icon" />
          </div>
          <div className="ai-select-wrapper">
            <select
              value={newScheduleTimeframe}
              onChange={(e) => setNewScheduleTimeframe(e.target.value as (typeof TIMEFRAME_OPTIONS)[number]['value'])}
              className="ai-select"
            >
              {TIMEFRAME_OPTIONS.map((item) => (
                <option key={`assoc-schedule-timeframe-${item.value}`} value={item.value}>{item.label}</option>
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
                <option key={`assoc-schedule-timing-${item}`} value={item}>{item}</option>
              ))}
            </select>
            <ChevronDown size={16} className="ai-select-icon" />
          </div>
          <button className="ai-btn-primary" onClick={handleAddSchedule}>
            <Plus size={16} /> إضافة
          </button>
        </div>
      </div>

      {/* Hidden PDF Export Template */}
      {exportContent && (
        <div id="association-pdf-template" className="pdf-export-wrapper" dir="rtl">
          <div className="pdf-export-header">
            <h1 className="pdf-export-title">{reportType}</h1>
            <div className="pdf-export-date">{new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <div className="pdf-export-divider"></div>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{exportContent}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default AssociationAICenter;
