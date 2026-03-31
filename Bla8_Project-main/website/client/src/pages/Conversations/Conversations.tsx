import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Send, X } from 'lucide-react';
import { formatTimeAgo } from '../../utils/dateUtils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Conversations.css';
import api from '../../services/api';
import { useSSEStream } from '../../hooks/useSSEStream';
import ErrorModal from '../../components/common/Modal/ErrorModal';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatPreview {
  request_id: number | null;
  other_user_id: number | null;
  other_party_name: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_direct: boolean;
  is_online?: boolean;    // v6
  last_seen?: string | null; // v6
}

interface Message {
  message_id: number;
  message_text: string;
  is_mine: boolean;
  created_at: string;
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' });
};

const AvatarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const AIBotIcon = ({ size = 40 }: { size?: number }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#0A304E" />
    <path d="M12 18h16v8a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4v-8z" fill="#DBA829" />
    <circle cx="16" cy="22" r="2" fill="#0A304E" />
    <circle cx="24" cy="22" r="2" fill="#0A304E" />
    <path d="M16 12h8" stroke="#DBA829" strokeWidth="2" strokeLinecap="round" />
    <path d="M20 12v-3" stroke="#DBA829" strokeWidth="2" strokeLinecap="round" />
    <circle cx="20" cy="8" r="1.5" fill="#DBA829" />
    <circle cx="30" cy="28" r="4" fill="#0CBC8B" stroke="#fff" strokeWidth="2" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Conversations = () => {
  const [searchParams] = useSearchParams();
  const initRequestId = searchParams.get('request_id');
  const initUserId = searchParams.get('user_id');

  // Panel 1 — Chats list
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [search, setSearch] = useState('');
  const [activeChat, setActiveChat] = useState<ChatPreview | null>(null);

  const hasAutoOpened = useRef(false);

  // Panel 2 — Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Panel 3 — AI
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConversationId, setAiConversationId] = useState<number | null>(null);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const aiEndRef = useRef<HTMLDivElement>(null);

  // Error Modal State
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // ─── Fetch Chats List ────────────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get('/messages/my-chats');
      const data: ChatPreview[] = res.data?.data || [];

      if (!hasAutoOpened.current && (initRequestId || initUserId)) {
        hasAutoOpened.current = true;

        let found: ChatPreview | null = null;
        if (initRequestId) {
          found = data.find(c => c.request_id === Number(initRequestId)) || null;
        } else if (initUserId) {
          found = data.find(c => c.other_user_id === Number(initUserId) && c.is_direct) || null;
        }

        if (found) {
          setChats(data);
          setActiveChat(found);
          // Fetch its history
          try {
            const url = found.request_id
              ? `/messages/chat-history/${found.request_id}`
              : `/messages/dm-history/${found.other_user_id}`;
            const msgRes = await api.get(url);
            setMessages(msgRes?.data?.data || []);
          } catch { /* silent */ }
        } else if (initRequestId) {
          // Create a placeholder for this new request chat
          const placeholder: ChatPreview = {
            request_id: Number(initRequestId),
            other_user_id: null,
            other_party_name: searchParams.get('name') || `محادثة طلب #${initRequestId}`,
            last_message: null,
            last_message_at: null,
            unread_count: 0,
            is_direct: false
          };
          setChats([placeholder, ...data]);
          setActiveChat(placeholder);
          setMessages([]);
        } else if (initUserId) {
          // Create a placeholder for this new DM
          const placeholder: ChatPreview = {
            request_id: null,
            other_user_id: Number(initUserId),
            other_party_name: searchParams.get('name') || `محادثة مباشرة`,
            last_message: null,
            last_message_at: null,
            unread_count: 0,
            is_direct: true
          };
          setChats([placeholder, ...data]);
          setActiveChat(placeholder);
          setMessages([]);
        }
      } else {
        setChats(data);
      }
    } catch { /* silent */ }
  }, [initRequestId, initUserId, searchParams]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  // ─── Fetch AI History ────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/chat/ai/history')
      .then(res => {
        const msgs: AIMessage[] = (res.data?.history || []).map((m: any) => ({
          role: m.role === 'ai' || m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
          created_at: m.created_at,
        }));
        setAiMessages(msgs);
        if (msgs.length > 0) {
          // Attempt to find conversation_id from the latest message from backend if applicable
          // 'history' endpoint doesn't strictly give conversation_id directly at top level,
          // but if we had conversational scope, we'd grab it.
          // For now, let's grab it if it exists in data
          const lastM = res.data?.history?.[res.data.history.length - 1];
          if (lastM?.conversation_id) setAiConversationId(lastM.conversation_id);
        }
      })
      .catch(() => { });
  }, []);

  // ─── Scroll helpers ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  // ─── Open a chat ─────────────────────────────────────────────────────────
  const openChat = async (chat: ChatPreview) => {
    setActiveChat(chat);
    setMessages([]);
    try {
      let res;
      if (chat.request_id) {
        res = await api.get(`/messages/chat-history/${chat.request_id}`);
      } else if (chat.other_user_id) {
        res = await api.get(`/messages/dm-history/${chat.other_user_id}`);
      }
      setMessages(res?.data?.data || []);
      // Mark as read using functional update so we always have fresh list
      setChats(prev => prev.map(c =>
        (c.request_id === chat.request_id && c.other_user_id === chat.other_user_id)
          ? { ...c, unread_count: 0 }
          : c
      ));
    } catch { /* silent */ }
  };

  // ─── Send Message ────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!msgInput.trim() || !activeChat || sending) return;
    setSending(true);
    try {
      const payload: any = { message_text: msgInput.trim() };
      if (activeChat.request_id) payload.request_id = activeChat.request_id;
      else if (activeChat.other_user_id) payload.receiver_id = activeChat.other_user_id;

      await api.post('/messages/', payload);
      setMsgInput('');
      // Refresh messages
      await openChat(activeChat);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'حدث خطأ أثناء إرسال الرسالة');
      setIsErrorModalOpen(true);
    } finally {
      setSending(false);
    }
  };

  const handleMsgKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ─── Send AI Message (No streaming for Analytics) ────────────────────────────────────
  const sendAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const text = aiInput.trim();
    setAiInput('');
    setAiMessages(p => [...p, { role: 'user', content: text }]);
    setAiLoading(true);

    try {
      const response = await api.post('/chat/analytics/send', { content: text });
      
      const content = response.data?.ai_response?.content || response.data?.content || 'تعذر الحصول على رد.';
      setAiMessages(p => [...p, { role: 'assistant', content }]);

    } catch (err) {
      setAiMessages(p => [...p, { role: 'assistant', content: 'حدث خطأ، يرجى المحاولة مجدداً.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Close the AI Panel
  const closeAIPanel = useCallback(() => {
    setAiLoading(false);
    setIsAIOpen(false);
  }, []);

  const handleAIKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); }
  };

  // ─── Filter chats by search ───────────────────────────────────────────────
  const filteredChats = chats.filter(c =>
    c.other_party_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="conv-page" dir="rtl">

      {/* ─── Right: Chats List ─── */}
      <div className="conv-contacts-col">
        <h2 className="conv-header-title">المحادثات</h2>

        <div className="conv-search-box">
          <Search size={16} className="conv-search-icon" />
          <input
            type="text"
            placeholder="ابحث ..."
            className="conv-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="conv-contacts-list">
          {filteredChats.length === 0 && (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 1rem', fontSize: '0.9rem' }}>
              لا توجد محادثات حالياً
            </p>
          )}
          {filteredChats.map((c) => {
            const isActive = c.request_id
              ? activeChat?.request_id === c.request_id
              : activeChat?.other_user_id === c.other_user_id;
            const key = c.request_id ? `req-${c.request_id}` : `dm-${c.other_user_id}`;
            return (
              <div
                key={key}
                className="conv-contact-item"
                style={{ background: isActive ? '#f1f5f9' : undefined }}
                onClick={() => openChat(c)}
              >
                <div className="conv-contact-avatar-wrap">
                  <div className="conv-contact-avatar bg-pink-100">
                    <AvatarIcon />
                  </div>
                </div>
                <div className="conv-contact-info">
                  <div className="conv-contact-top">
                    <h4 className="conv-contact-name">{c.other_party_name}</h4>
                    <span className="conv-contact-time">{formatTime(c.last_message_at)}</span>
                  </div>
                  <div className="conv-contact-bottom">
                    <p className="conv-contact-msg">{c.last_message || '—'}</p>
                    {c.unread_count > 0 && (
                      <span className="conv-contact-unread">{c.unread_count}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Middle: Active Chat ─── */}
      <div className="conv-chat-col">
        {!activeChat ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: '1rem' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>اختر محادثة من القائمة للبدء</p>
          </div>
        ) : (
          <>
            <div className="conv-chat-header">
              <div className="conv-chat-header-info">
                <h3 className="conv-chat-title">{activeChat.other_party_name}</h3>
                <div className="conv-chat-status">
                  <span className={`conv-status-dot ${(activeChat.is_online || (activeChat.last_seen && (new Date().getTime() - new Date(activeChat.last_seen).getTime() < 60000))) ? 'online' : 'offline'}`}></span>
                  {(activeChat.is_online || (activeChat.last_seen && (new Date().getTime() - new Date(activeChat.last_seen).getTime() < 60000)))
                    ? 'متصل الآن'
                    : (activeChat.last_seen ? `آخر ظهور ${formatTimeAgo(activeChat.last_seen)}` : 'غير متصل')}
                </div>
              </div>
              <div className="conv-chat-header-icons">
                <div className="conv-chat-header-avatar bg-pink-100">
                  <AvatarIcon />
                </div>
              </div>
            </div>

            <div className="conv-chat-messages">
              {messages.map((msg, idx) => {
                const dateStr = formatDate(msg.created_at);
                const showDivider = idx === 0 || formatDate(messages[idx - 1].created_at) !== dateStr;

                return (
                  <React.Fragment key={msg.message_id}>
                    {showDivider && (
                      <div className="conv-date-divider"><span>{dateStr}</span></div>
                    )}
                    <div className={`conv-msg-row ${msg.is_mine ? 'conv-msg-sent' : 'conv-msg-received'}`}>
                      {/* Sent: Avatar first (Right), then Bubble. Received: Bubble first, then Avatar (Left) */}
                      {msg.is_mine && (
                        <div className="conv-msg-avatar bg-red-100"><AvatarIcon /></div>
                      )}

                      <div className={`conv-msg-bubble ${msg.is_mine ? 'bg-gold' : 'bg-light'}`}>
                        <p className="conv-msg-text">{msg.message_text}</p>
                        <span className="conv-msg-time">{formatTime(msg.created_at)}</span>
                      </div>

                      {!msg.is_mine && (
                        <div className="conv-msg-avatar bg-pink-100"><AvatarIcon /></div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
              {messages.length === 0 && (
                <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem', fontSize: '0.9rem' }}>
                  لا توجد رسائل بعد — ابدأ المحادثة!
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="conv-chat-input-area">
              <div className="conv-input-wrapper">
                <button className="conv-input-btn conv-input-send" onClick={sendMessage} disabled={sending}>
                  <Send size={18} />
                </button>
                <input
                  type="text"
                  placeholder="اكتب رسالتك ..."
                  className="conv-input"
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={handleMsgKey}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Floating AI Button ─── */}
      <button className={`ai-fab-btn ${isAIOpen ? 'hidden' : ''}`} onClick={() => setIsAIOpen(true)} aria-label="افتح المساعد">
        <AIBotIcon size={32} />
      </button>

      {/* ─── Left: AI Assistant (Now a Popup) ─── */}
      <div className={`conv-ai-col ${isAIOpen ? 'open' : 'closed'}`}>
        <div className="conv-ai-header">
          <div className="conv-ai-title-wrap" style={{ justifyContent: 'space-between', width: '100%' }}>
            <button className="conv-icon-btn" onClick={closeAIPanel} aria-label="أغلق المساعد">
              <X size={24} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 className="conv-ai-title">المساعد الشخصي</h3>
              <div className="conv-ai-avatar">
                <AIBotIcon />
              </div>
            </div>
          </div>
        </div>

        <div className="conv-chat-messages">
          {aiMessages.length === 0 && (
            <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem', fontSize: '0.9rem' }}>
              كيف يمكنني مساعدتك اليوم؟
            </p>
          )}
          {aiMessages.map((msg, i) => (
            <div key={i} className={`conv-msg-row conv-msg-ai ${msg.role === 'user' ? 'conv-msg-sent' : 'conv-msg-received'}`}>
              {msg.role === 'user' && (
                <div className="conv-msg-avatar bg-red-100"><AvatarIcon /></div>
              )}

              <div className={`conv-msg-bubble ${msg.role === 'user' ? 'bg-gold-light' : 'bg-gold'}`}>
                {msg.role === 'assistant' ? (
                  <div className="conv-msg-text markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="conv-msg-text">{msg.content}</p>
                )}
                {msg.created_at && <span className="conv-msg-time">{formatTime(msg.created_at)}</span>}
              </div>

              {msg.role === 'assistant' && (
                <div className="conv-msg-avatar"><AIBotIcon size={36} /></div>
              )}
            </div>
          ))}

          <div ref={aiEndRef} />
        </div>

        <div className="conv-chat-input-area">
          <div className="conv-input-wrapper">
            <button className="conv-input-btn conv-input-send" onClick={sendAI} disabled={aiLoading}>
              <Send size={18} />
            </button>
            <input
              type="text"
              placeholder="اسأل المساعد ..."
              className="conv-input"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={handleAIKey}
            />
          </div>
        </div>
      </div>

      <ErrorModal 
        isOpen={isErrorModalOpen} 
        onClose={() => setIsErrorModalOpen(false)} 
        message={errorMessage} 
      />

    </div>
  );
};

export default Conversations;
