import React, { useState, useRef, useEffect } from 'react';
import { Bot, Plus, Send, MessageCircle, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../services/api';
import './NonMuslimDashboard.css';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

const NonMuslimDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. التحقق من حالة الدخول عند تحميل المكون
  useEffect(() => {
    const token = localStorage.getItem('token');
    const authStatus = !token;
    setIsGuest(authStatus);

    if (authStatus) {
      // إذا كان زائراً: تحميل من sessionStorage (مؤقت)
      const saved = sessionStorage.getItem('guest_nm_sessions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const guestSessions = parsed.map((s: any) => ({ ...s, timestamp: new Date(s.timestamp) }));
          setSessions(guestSessions);
          setActiveChatId(sessionStorage.getItem('guest_nm_active_id'));
        } catch { setSessions([]); }
      }
    } else {
      // إذا كان مسجلاً: جلب الجلسات الحقيقية من الباكيند
      api.get('/chat/conversations')
        .then(res => {
          const conversations = res.data?.conversations || [];
          const userSessions: ChatSession[] = conversations.map((c: any) => ({
            id: c.id.toString(),
            title: c.title,
            lastMessage: 'محادثة سابقة',
            timestamp: new Date(c.created_at),
            messages: []
          }));
          setSessions(userSessions);
          if (userSessions.length > 0) setActiveChatId(userSessions[0].id);
        })
        .catch(err => console.error('Failed to fetch user conversations:', err));
    }
  }, []);

  const activeSession = sessions.find(s => s.id === activeChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 2. حفظ بيانات الضيف فقط في sessionStorage (تُمسح عند إغلاق التبويب)
  useEffect(() => {
    if (isGuest && sessions.length > 0) {
      sessionStorage.setItem('guest_nm_sessions', JSON.stringify(sessions));
    }
  }, [sessions, isGuest]);

  useEffect(() => {
    if (isGuest && activeChatId) {
      sessionStorage.setItem('guest_nm_active_id', activeChatId);
    }
  }, [activeChatId, isGuest]);

  // 3. جلب التاريخ عند تغيير المحادثة
  useEffect(() => {
    if (activeChatId) {
      scrollToBottom();
      
      const historyUrl = isGuest 
        ? `/chat/ai/guest/history/${activeChatId}`
        : `/chat/ai/conversations/${activeChatId}/messages`;

      api.get(historyUrl)
        .then(res => {
          const history = res.data?.history || [];
          if (history.length > 0) {
            const mappedMessages: Message[] = history.map((m: any) => ({
              id: m.id.toString(),
              sender: m.role === 'ai' ? 'bot' : 'user',
              text: m.content,
              timestamp: new Date(m.created_at)
            }));

            setSessions(prev => prev.map(s => {
              if (s.id === activeChatId) {
                // دمج التاريخ مع الحفاظ على أي رسائل محلية جديدة لم تُحفظ بعد في السيرفر (اختياري)
                return { ...s, messages: mappedMessages };
              }
              return s;
            }));
          }
        })
        .catch(err => console.error('Failed to fetch history:', err));
    }
  }, [activeChatId, isGuest]);

  const startNewChat = async () => {
    if (isGuest) {
      const newId = Date.now().toString();
      const newSession: ChatSession = {
        id: newId,
        title: `محادثة زائر ${sessions.length + 1}`,
        lastMessage: 'أهلاً 👋 أنا مساعدك...',
        timestamp: new Date(),
        messages: [] // الرسالة الترحيبية ستأتي من الباكيند
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveChatId(newId);
    } else {
      // إنشاء جلسة جديدة في الباكيند للمستخدم المسجل
      try {
        const res = await api.post('/chat/conversations', { title: `محادثة ${sessions.length + 1}` });
        const newConv = res.data;
        const newSession: ChatSession = {
          id: newConv.id.toString(),
          title: newConv.title,
          lastMessage: 'بداية المحادثة',
          timestamp: new Date(newConv.created_at),
          messages: []
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveChatId(newSession.id);
      } catch (err) {
        console.error('Failed to create conversation:', err);
      }
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !activeChatId || loading) return;

    const userText = inputValue.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date()
    };

    const initialBotMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      text: '...', // مؤشر بدء التفكير
      timestamp: new Date()
    };

    setSessions(prev => prev.map(session => {
      if (session.id === activeChatId) {
        return {
          ...session,
          messages: [...session.messages, userMessage, initialBotMessage],
          lastMessage: userText,
          timestamp: new Date()
        };
      }
      return session;
    }));
    
    setInputValue('');
    setLoading(true);

    try {
      const streamUrl = isGuest 
        ? '/api/chat/ai/guest/send?stream=true' 
        : `/api/chat/ai/conversations/${activeChatId}/messages?stream=true`;
      
      const body = isGuest 
        ? JSON.stringify({ session_id: activeChatId, message: userText })
        : JSON.stringify({ content: userText });

      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        credentials: 'include' // للحفاظ على الجلسة (HttpOnly Cookies)
      });

      if (!response.ok) throw new Error('فشل الاتصال بالخادم');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        let partialLine = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          console.log("[Stream] Raw chunk received:", chunk.length, "bytes");
          const lines = (partialLine + chunk).split('\n');
          partialLine = lines.pop() || ''; // الحفاظ على الجزء غير الكامل للchunk القادم

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const content = line.substring(6);
              console.log("[Stream] Data content:", content);
              fullContent += content;

              // تحديث الواجهة لحظياً بالقطعة الجديدة
              setSessions(prev => prev.map(session => {
                if (session.id === activeChatId) {
                  const updatedMessages = [...session.messages];
                  const lastMsgIndex = updatedMessages.length - 1;
                  if (updatedMessages[lastMsgIndex]?.sender === 'bot') {
                    updatedMessages[lastMsgIndex] = { 
                      ...updatedMessages[lastMsgIndex], 
                      text: fullContent 
                    };
                  }
                  return { ...session, messages: updatedMessages, lastMessage: fullContent };
                }
                return session;
              }));
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error in streaming:', error);
      const errorText = 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.';
      
      setSessions(prev => prev.map(session => {
        if (session.id === activeChatId) {
          const updatedMessages = [...session.messages];
          const lastMsgIndex = updatedMessages.length - 1;
          if (updatedMessages[lastMsgIndex]?.sender === 'bot') {
            updatedMessages[lastMsgIndex] = { ...updatedMessages[lastMsgIndex], text: errorText };
          }
          return { ...session, messages: updatedMessages };
        }
        return session;
      }));
    } finally {
      setLoading(false);

      // ─── Auto-sync: re-fetch history from API after stream ends ───────────
      // The backend saves the full message after streaming completes.
      // Fetching it here ensures the UI shows the clean API version
      // (identical to what a manual page refresh would do).
      const currentId = activeChatId; // capture in closure before any state change
      if (currentId) {
        const historyUrl = isGuest
          ? `/chat/ai/guest/history/${currentId}`
          : `/chat/ai/conversations/${currentId}/messages`;

        api.get(historyUrl)
          .then(res => {
            const history: Array<{ id?: number; role: string; content: string; created_at: string }> =
              res.data?.history || [];
            if (history.length > 0) {
              const fresh: Message[] = history.map(m => ({
                id: m.id?.toString() ?? Date.now().toString(),
                sender: (m.role === 'ai' || m.role === 'assistant') ? 'bot' : 'user',
                text: m.content,
                timestamp: new Date(m.created_at),
              }));
              setSessions(prev => prev.map(s =>
                s.id === currentId ? { ...s, messages: fresh } : s
              ));
            }
          })
          .catch(() => { /* silent — local state already looks fine */ });
      }
      // ──────────────────────────────────────────────────────────────────────

    }
  };

  return (
    <div className="nm-page" dir="rtl">
      {/* ── Right Sidebar: Sessions ── */}
      <aside className="nm-sidebar">
        {/* Bot header */}
        <div className="nm-sidebar-header">
          <div className="nm-sidebar-avatar">
            <Bot size={28} color="#f6ad55" />
            <div className="nm-online-dot" />
          </div>
          <div>
            <h2 className="nm-sidebar-title">المساعد الآلي</h2>
            <span className="nm-sidebar-status">متاح الآن</span>
          </div>
        </div>

        {/* New chat button */}
        <button className="nm-new-chat-btn" onClick={startNewChat}>
          <Plus size={18} />
          محادثة جديدة
        </button>

        {/* Sessions list */}
        <div className="nm-sessions-list">
          {sessions.length === 0 ? (
            <p className="nm-no-sessions">لا توجد محادثات بعد</p>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                className={`nm-session-card ${activeChatId === session.id ? 'active' : ''}`}
                onClick={() => setActiveChatId(session.id)}
              >
                <div className="nm-session-icon">
                  <MessageCircle size={20} />
                </div>
                <div className="nm-session-content">
                  <div className="nm-session-header">
                    <span className="nm-session-name">{session.title}</span>
                    <span className="nm-session-time">
                      <Calendar size={10} />
                      {session.timestamp.toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <p className="nm-session-last-msg">{session.lastMessage}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Left Panel: Chat ── */}
      <main className="nm-chat-panel">
        {activeSession ? (
          <>
            {/* Chat header */}
            <div className="nm-chat-header">
              <div className="nm-header-avatar">
                <Bot size={22} color="#f6ad55" />
              </div>
              <div className="nm-header-bot-info">
                <span className="nm-header-name">المساعد الآلي</span>
                <span className="nm-header-sub">متاح الآن • {activeSession.title}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="nm-chat-messages">
              {activeSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`nm-message ${msg.sender === 'bot' ? 'nm-bot-message' : 'nm-user-message'}`}
                >
                  {msg.sender === 'bot' ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className="nm-chat-input-area" onSubmit={handleSend}>
              <MessageCircle size={20} color="#17648B" style={{ flexShrink: 0, opacity: 0.6 }} />
              <input
                type="text"
                placeholder="اكتب رسالتك هنا..."
                className="nm-chat-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button type="submit" className="nm-send-btn" disabled={!inputValue.trim()}>
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          /* Empty state */
          <div className="nm-empty-state">
            <div className="nm-empty-avatar">
              <Bot size={56} color="#f6ad55" />
              <div className="nm-online-dot" />
            </div>
            <h3 className="nm-empty-title">أهلاً بك 👋</h3>
            <p className="nm-empty-text">اختر محادثة من القائمة أو ابدأ محادثة جديدة</p>
            <button className="nm-start-btn" onClick={startNewChat}>
              <Plus size={18} />
              بدء محادثة جديدة
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default NonMuslimDashboard;
