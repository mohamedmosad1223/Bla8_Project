import React, { useState, useRef, useEffect } from 'react';
import { Bot, Plus, Send, MessageCircle, Calendar } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeChatId) scrollToBottom();
  }, [sessions, activeChatId]);

  const startNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: `محادثة ${sessions.length + 1}`,
      lastMessage: 'أهلاً 👋 أنا مساعدك...',
      timestamp: new Date(),
      messages: [
        {
          id: '1',
          sender: 'bot',
          text: 'أهلاً 👋 أنا مساعدك. هل يمكنني طرح بعض الأسئلة للتعرف عليك أكثر؟',
          timestamp: new Date()
        }
      ]
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveChatId(newId);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !activeChatId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue.trim(),
      timestamp: new Date()
    };

    setSessions(prev => prev.map(session => {
      if (session.id === activeChatId) {
        return {
          ...session,
          messages: [...session.messages, newMessage],
          lastMessage: newMessage.text,
          timestamp: new Date()
        };
      }
      return session;
    }));
    setInputValue('');
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
                  {msg.text}
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
