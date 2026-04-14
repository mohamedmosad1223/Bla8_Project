import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Send, User } from 'lucide-react';
import api from '../../services/api';
import { formatTimeAgo } from '../../utils/dateUtils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ErrorModal from '../../components/common/Modal/ErrorModal';
import { useLanguage } from '../../i18n';
import './NonMuslimConversation.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatPreview {
  request_id: number | null;
  other_user_id: number | null;
  other_party_name: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_online?: boolean;    // v6
  last_seen?: string | null; // v6
  is_direct: boolean;
}

interface Message {
  message_id: number;
  message_text: string;
  is_mine: boolean;
  created_at: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const NonMuslimConversation: React.FC = () => {
  const { t, dir } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initRequestId = searchParams.get('request_id');

  const [msgInput, setMsgInput] = useState('');
  const [contacts, setContacts] = useState<ChatPreview[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeContact, setActiveContact] = useState<ChatPreview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [sending, setSending] = useState(false);

  // Error Modal State
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const hasAutoOpened = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Load contacts ────────────────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get('/messages/my-chats');
      const data: ChatPreview[] = res.data?.data || [];

      if (initRequestId && !hasAutoOpened.current) {
        hasAutoOpened.current = true;
        const found = data.find(c => c.request_id === Number(initRequestId)) || null;

        if (found) {
          setContacts(data);
          setActiveContact(found);
          try {
            const msgRes = await api.get(`/messages/chat-history/${found.request_id}`);
            setMessages(msgRes?.data?.data || []);
          } catch { /* silent */ }
        } else {
          const placeholder: ChatPreview = {
            request_id: Number(initRequestId),
            other_user_id: null,
            other_party_name: searchParams.get('name') || `${t('nonMuslimConversation.requestChat')}${initRequestId}`,
            last_message: null,
            last_message_at: null,
            unread_count: 0,
            is_direct: false,
          };
          setContacts([placeholder, ...data]);
          setActiveContact(placeholder);
          setMessages([]);
        }
      } else {
        setContacts(data);
      }
    } catch { /* silent */ } finally {
      setLoadingChats(false);
    }
  }, [initRequestId, searchParams, t]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  // ─── Open a chat ──────────────────────────────────────────────────────────
  const openChat = async (chat: ChatPreview) => {
    setActiveContact(chat);
    setMessages([]);
    try {
      let res;
      if (chat.request_id) {
        res = await api.get(`/messages/chat-history/${chat.request_id}`);
      } else if (chat.other_user_id) {
        res = await api.get(`/messages/dm-history/${chat.other_user_id}`);
      }
      setMessages(res?.data?.data || []);
      setContacts(prev => prev.map(c =>
        (c.request_id === chat.request_id && c.other_user_id === chat.other_user_id)
          ? { ...c, unread_count: 0 }
          : c
      ));
    } catch { /* silent */ }
  };

  // ─── Send Message via REST API ────────────────────────────────────────────
  const handleSend = async () => {
    if (!msgInput.trim() || !activeContact || sending) return;
    setSending(true);
    try {
      const payload: Record<string, unknown> = { message_text: msgInput.trim() };
      if (activeContact.request_id) {
        payload.request_id = activeContact.request_id;
      } else if (activeContact.other_user_id) {
        payload.receiver_id = activeContact.other_user_id;
      }

      await api.post('/messages/', payload);
      setMsgInput('');
      // Refresh messages after sending
      await openChat(activeContact);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setErrorMessage(error.response?.data?.detail || t('nonMuslimConversation.sendError'));
      setIsErrorModalOpen(true);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.other_party_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="nm-conversation-page" dir="rtl">

      {/* ─── Contacts Sidebar (Right) ─── */}
      <div className="nm-contacts-sidebar">
        <div className="nm-contacts-header">
          <h2 className="nm-contacts-title">{t('nonMuslimConversation.messages')}</h2>
          <div className="nm-search-box">
            <Search size={18} className="nm-search-icon" />
            <input 
              type="text" 
              placeholder={t('nonMuslimConversation.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="nm-contacts-list">
          {loadingChats ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>{t('nonMuslimDashboard.loading')}</p>
          ) : filteredContacts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>{t('nonMuslimConversation.noResults')}</p>
          ) : filteredContacts.map((c) => {
            const isActive = c.request_id
              ? activeContact?.request_id === c.request_id
              : activeContact?.other_user_id === c.other_user_id;
            const key = c.request_id ? `req-${c.request_id}` : `dm-${c.other_user_id}`;
            return (
              <div
                key={key}
                className={`nm-contact-item ${isActive ? 'active' : ''}`}
                onClick={() => openChat(c)}
                style={{ cursor: 'pointer' }}
              >
                <div className="nm-contact-avatar">
                  <User size={24} />
                </div>
                <div className="nm-contact-info">
                  <div className="nm-contact-top">
                    <h4 className="nm-contact-name">{c.other_party_name}</h4>
                    <span className="nm-contact-time">{(c.last_message_at || '').split('T')[0]}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p className="nm-contact-msg">{c.last_message || '—'}</p>
                    {c.unread_count > 0 && (
                      <span style={{ background: '#db2777', color: 'white', borderRadius: '50%', padding: '0 6px', fontSize: '12px' }}>
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Active Chat Window (Left) ─── */}
      <div className="nm-chat-window">
        {/* Chat Header */}
        <div className="nm-chat-header">
          {activeContact && (
            <div className="nm-chat-header-user">
              <div className="nm-contact-avatar">
                <User size={24} color="#555" />
              </div>
              <div>
                <h3 className="nm-chat-header-title" style={{ color: '#ffffff' }}>{activeContact.other_party_name}</h3>
                <div className="nm-chat-header-status">
                  <span className="nm-status-dot" 
                        style={{ backgroundColor: (activeContact.is_online || (activeContact.last_seen && (new Date().getTime() - new Date(activeContact.last_seen).getTime() < 60000))) ? '#10b981' : '#94a3b8' }}></span>
                  {(activeContact.is_online || (activeContact.last_seen && (new Date().getTime() - new Date(activeContact.last_seen).getTime() < 60000))) 
                    ? t('nonMuslimConversation.online') 
                    : (activeContact.last_seen ? `${t('nonMuslimConversation.lastSeen')} ${formatTimeAgo(activeContact.last_seen)}` : t('nonMuslimConversation.offline'))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="nm-chat-messages">
          {!activeContact ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
              {t('nonMuslimConversation.selectChat')}
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
              {t('nonMuslimConversation.noMessages')}
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.message_id} className={`nm-msg-row ${msg.is_mine ? 'sent' : 'received'}`}>
                  <div className="nm-msg-avatar">
                    <User size={18} color="#94a3b8" />
                  </div>
                  <div className="nm-msg-bubble" dir={dir}>
                    {msg.is_mine ? (
                      <p className="nm-msg-text">{msg.message_text}</p>
                    ) : (
                      <div className="nm-msg-text markdown-content">
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
                          {msg.message_text}
                        </ReactMarkdown>
                      </div>
                    )}
                    <span className="nm-msg-time">
                      {new Date(msg.created_at).toLocaleTimeString(dir === 'rtl' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Chat Input */}
        <div className="nm-chat-input-area">
          <div className="nm-input-wrapper">
            <button
              className="nm-send-btn"
              onClick={handleSend}
              disabled={!activeContact || !msgInput.trim() || sending}
            >
              <Send size={18} style={{ transform: dir === 'ltr' ? 'none' : 'rotate(180deg)' }} />
            </button>
            <input
              type="text"
              placeholder={t('nonMuslimConversation.typeMessage')}
              className="nm-input"
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!activeContact || sending}
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

export default NonMuslimConversation;
