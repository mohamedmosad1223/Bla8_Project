import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Send, MessageCircle, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../services/api';
import { useLanguage } from '../../i18n';
import './NonMuslimDashboard.css';

// ─── Guest Session Isolation ──────────────────────────────────────────────────
// كل browser session بتاخد UUID فريد — لضمان عزل الـ sessions بين المستخدمين
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ─── Auth State Helper ────────────────────────────────────────────────────────
// الـ Backend يستخدم HttpOnly Cookie مش Bearer Token.
// ⚠️ userRole وحده مش كافي — بيتحفظ حتى للـ guest من صفحة HowToStart
//    بدون login حقيقي. نستخدم userData اللي بيتحفظ فقط بعد login ناجح (getMe).
const getIsActuallyLoggedIn = (): boolean => {
  const userData = localStorage.getItem('userData');
  if (!userData) return false;
  try {
    const parsed = JSON.parse(userData);
    // userData بيكون فيه user object بـ user_id لو اللوجين نجح فعلاً
    return !!(parsed?.user?.user_id ?? parsed?.user_id);
  } catch {
    return false;
  }
};

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
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. تحديد حالة الدخول عند أول تحميل
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loggedIn = getIsActuallyLoggedIn();
    setIsGuest(!loggedIn);

    if (!loggedIn) {
      // ─── زائر (Guest) ───────────────────────────────────────────────────────
      // نجيب أو ننشئ UUID فريد لهذه الـ browser session
      // لو تغير المستخدم أو انتهت الـ session، الـ UUID بيتغير وبيمسحلنا البيانات القديمة
      let browserSessionId = sessionStorage.getItem('nm_browser_session_id');
      if (!browserSessionId) {
        browserSessionId = generateUUID();
        sessionStorage.setItem('nm_browser_session_id', browserSessionId);
      }

      const savedSessions = sessionStorage.getItem('guest_nm_sessions');
      const savedSessionOwner = sessionStorage.getItem('guest_nm_session_owner');

      if (savedSessions && savedSessionOwner === browserSessionId) {
        // نفس الـ browser session → نحمل الجلسات المحفوظة
        try {
          const parsed = JSON.parse(savedSessions);
          const guestSessions = parsed.map((s: any) => ({ ...s, timestamp: new Date(s.timestamp) }));
          setSessions(guestSessions);
          setActiveChatId(sessionStorage.getItem('guest_nm_active_id'));
        } catch {
          setSessions([]);
        }
      } else {
        // browser session مختلفة أو شخص جديد → نمسح القديم ونبدأ نظيف
        sessionStorage.removeItem('guest_nm_sessions');
        sessionStorage.removeItem('guest_nm_active_id');
        sessionStorage.setItem('guest_nm_session_owner', browserSessionId);
        setSessions([]);
      }
    } else {
      // ─── مستخدم مسجل ────────────────────────────────────────────────────────
      // نمسح أي بيانات guest قديمة (لو كان زائراً قبل كده في نفس الـ browser)
      sessionStorage.removeItem('guest_nm_sessions');
      sessionStorage.removeItem('guest_nm_active_id');
      sessionStorage.removeItem('guest_nm_session_owner');
      sessionStorage.removeItem('nm_browser_session_id');

      // نجلب المحادثات من الـ Backend — مفلترة بـ user_id تلقائياً
      api.get('/chat/conversations')
        .then(res => {
          const conversations = res.data?.conversations || [];
          const userSessions: ChatSession[] = conversations.map((c: any) => ({
            id: c.id.toString(),
            title: c.title,
            lastMessage: t('nonMuslimDashboard.previousChat'),
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

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. حفظ بيانات الزائر في sessionStorage (مرتبطة بـ browser session ID)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isGuest && sessions.length > 0) {
      sessionStorage.setItem('guest_nm_sessions', JSON.stringify(sessions));
      const browserSessionId = sessionStorage.getItem('nm_browser_session_id');
      if (browserSessionId) {
        sessionStorage.setItem('guest_nm_session_owner', browserSessionId);
      }
    }
  }, [sessions, isGuest]);

  useEffect(() => {
    if (isGuest && activeChatId) {
      sessionStorage.setItem('guest_nm_active_id', activeChatId);
    }
  }, [activeChatId, isGuest]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. جلب التاريخ عند تغيير المحادثة
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeChatId) {
      scrollToBottom();

      // ✔️ مسارات صحيحة:
      //   Guest:  /chat/ai/guest/history/{session_id}  (مع /ai/)
      //   Logged: /chat/conversations/{id}/messages    (بدون /ai/)
      const historyUrl = isGuest
        ? `/chat/ai/guest/history/${activeChatId}`
        : `/chat/conversations/${activeChatId}/messages`;

      api.get(historyUrl)
        .then(res => {
          const history = res.data?.history || [];
          // الرسالة الترحيبية من السيرفر (موجودة في كلا المسارين)
          const serverWelcome: string | undefined = res.data?.welcome_message;

          let mappedMessages: Message[];

          if (history.length > 0) {
            // يوجد تاريخ → نعرضه كما هو
            mappedMessages = history.map((m: any) => ({
              id: m.id.toString(),
              sender: (m.role === 'ai' || m.role === 'assistant') ? 'bot' : 'user',
              text: m.content,
              timestamp: new Date(m.created_at)
            }));
          } else {
            // محادثة جديدة فارغة → نعرض الرسالة الترحيبية
            const welcomeText = serverWelcome ||
              'مرحباً بك! 👋 أنا مساعدك الذكي هنا للإجابة على استفساراتك حول الإسلام والتعريف به. كيف يمكنني مساعدتك اليوم؟';
            mappedMessages = [{
              id: `welcome-${activeChatId}`,
              sender: 'bot',
              text: welcomeText,
              timestamp: new Date()
            }];
          }

          setSessions(prev => prev.map(s => {
            if (s.id === activeChatId) {
              return { ...s, messages: mappedMessages };
            }
            return s;
          }));
        })
        .catch(err => console.error('Failed to fetch history:', err));
    }
  }, [activeChatId, isGuest]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. بدء محادثة جديدة
  // ─────────────────────────────────────────────────────────────────────────────
  const startNewChat = async () => {
    if (isGuest) {
      // UUID فريد لكل محادثة guest → يضمن عزل المحادثات في الـ DB
      const newId = generateUUID();
      const newSession: ChatSession = {
        id: newId,
        title: `${t('nonMuslimDashboard.guestSession')} ${sessions.length + 1}`,
        lastMessage: t('nonMuslimDashboard.welcomeMsg'),
        timestamp: new Date(),
        messages: []
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveChatId(newId);
    } else {
      // إنشاء جلسة جديدة في الـ Backend للمستخدم المسجل
      try {
        const res = await api.post('/chat/conversations', {
          title: `${t('nonMuslimDashboard.newChat')} ${sessions.length + 1}`
        });
        const newConv = res.data;
        const newSession: ChatSession = {
          id: newConv.id.toString(),
          title: newConv.title,
          lastMessage: '...',
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

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. إرسال رسالة مع Streaming
  // ─────────────────────────────────────────────────────────────────────────────
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
      text: '...',
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
      // ✔️ مسارات صحيحة:
      //   Guest:  /api/chat/ai/guest/send?stream=true       (مع /ai/)
      //   Logged: /api/chat/conversations/{id}/messages      (بدون /ai/)
      const streamUrl = isGuest
        ? '/api/chat/ai/guest/send?stream=true'
        : `/api/chat/conversations/${activeChatId}/messages?stream=true`;

      const body = isGuest
        ? JSON.stringify({ session_id: activeChatId, message: userText })
        : JSON.stringify({ content: userText });

      // credentials: 'include' يبعت الـ HttpOnly Cookie تلقائياً مع الـ request
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        credentials: 'include'
      });

      if (!response.ok) throw new Error('connection error');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        let partialLine = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = (partialLine + chunk).split('\n');
          partialLine = lines.pop() || '';

          for (const line of lines) {
            if (!line || line === 'data: [DONE]') continue;

            const content = line.replace(/^data:\s?/i, '');
            if (content) {
              fullContent += content;
            }

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
    } catch (error: any) {
      console.error('Error in streaming:', error);
      const errorText = t('nonMuslimDashboard.connectionError');

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

      // Refresh history from server after streaming completes
      const currentId = activeChatId;
      if (currentId) {
        // ✔️ مسارات صحيحة:
        //   Guest:  /chat/ai/guest/history/{session_id}  (مع /ai/)
        //   Logged: /chat/conversations/{id}/messages    (بدون /ai/)
        const historyUrl = isGuest
          ? `/chat/ai/guest/history/${currentId}`
          : `/chat/conversations/${currentId}/messages`;

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
          .catch(() => { /* silent */ });
      }
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
            <h2 className="nm-sidebar-title">{t('nonMuslimDashboard.aiAssistant')}</h2>
            <span className="nm-sidebar-status">{t('nonMuslimDashboard.available')}</span>
          </div>
        </div>

        {/* New chat button */}
        <button className="nm-new-chat-btn" onClick={startNewChat}>
          <Plus size={18} />
          {t('nonMuslimDashboard.newChat')}
        </button>

        {/* Sessions list */}
        <div className="nm-sessions-list">
          {sessions.length === 0 ? (
            <p className="nm-no-sessions">{t('nonMuslimDashboard.noChats')}</p>
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
                      {session.timestamp.toLocaleDateString(dir === 'rtl' ? 'ar-EG' : 'en-US')}
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
                <span className="nm-header-name">{t('nonMuslimDashboard.aiAssistant')}</span>
                <span className="nm-header-sub">{t('nonMuslimDashboard.available')} • {activeSession.title}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="nm-chat-messages">
              {activeSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`nm-message ${msg.sender === 'bot' ? 'nm-bot-message' : 'nm-user-message'}`}
                  dir={dir}
                >
                  {msg.sender === 'bot' ? (
                    <div className="markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, ...props }) => {
                            const isRegisterLink = props.href === '/register';
                            if (isRegisterLink) {
                              return (
                                <a
                                  href="/register"
                                  className="nm-register-btn-inline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigate('/register');
                                  }}
                                >
                                  {props.children}
                                </a>
                              );
                            }
                            return <a {...props} />;
                          }
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
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
                placeholder={t('nonMuslimDashboard.typeMessage')}
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
            <h3 className="nm-empty-title">{t('nonMuslimDashboard.welcome')}</h3>
            <p className="nm-empty-text">{t('nonMuslimDashboard.selectOrStart')}</p>
            <button className="nm-start-btn" onClick={startNewChat}>
              <Plus size={18} />
              {t('nonMuslimDashboard.startNewChat')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default NonMuslimDashboard;
