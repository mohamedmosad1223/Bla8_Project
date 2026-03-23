import React, { useState, useRef, useEffect } from 'react';
import { Bot, Plus, Send, ArrowRight, MessageCircle, Calendar } from 'lucide-react';
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
      title: `محادثة جديدة`,
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

  // ── Chat Window View ──
  if (activeChatId && activeSession) {
    return (
      <div className="nm-chat-window" dir="rtl">
        <div className="nm-chat-header">
          <button className="nm-back-btn" onClick={() => setActiveChatId(null)}>
            <ArrowRight size={24} />
          </button>
          <div className="nm-header-bot-info">
            <div className="nm-header-avatar">
              <Bot size={24} color="#f6ad55" />
            </div>
            <span>المساعد الآلي</span>
          </div>
        </div>
        
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

        <form className="nm-chat-input-area" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="اكتب رسالتك هنا..."
            className="nm-chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="nm-send-btn" disabled={!inputValue.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>
    );
  }

  // ── Main/History View ──
  return (
    <div className="nm-dashboard-container" dir="rtl">
      {sessions.length === 0 ? (
        <div className="nm-chat-area">
          <div className="nm-bot-container">
            <div className="nm-bot-avatar-bg">
              <Bot size={80} color="#f6ad55" className="nm-bot-icon" />
              <div className="nm-online-dot"></div>
            </div>
          </div>
          <div className="nm-greeting-message">
            <p>أهلاً 👋 أنا مساعدك. هل يمكنني طرح بعض الأسئلة للتعرف عليك أكثر؟</p>
          </div>
        </div>
      ) : (
        <div className="nm-history-area">
          <h2 className="nm-history-title">المحادثات السابقة</h2>
          <div className="nm-sessions-list">
            {sessions.map(session => (
              <div 
                key={session.id} 
                className="nm-session-card"
                onClick={() => setActiveChatId(session.id)}
              >
                <div className="nm-session-icon">
                  <MessageCircle size={24} color="#1e5387" />
                </div>
                <div className="nm-session-content">
                  <div className="nm-session-header">
                    <span className="nm-session-name">{session.title}</span>
                    <span className="nm-session-time">
                      <Calendar size={12} style={{ marginLeft: '4px' }} />
                      {session.timestamp.toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <p className="nm-session-last-msg">{session.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="nm-fab" onClick={startNewChat}>
        <Plus size={32} color="#fff" />
      </button>
    </div>
  );
};

export default NonMuslimDashboard;
