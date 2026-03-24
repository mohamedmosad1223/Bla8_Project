import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Image as ImageIcon, User } from 'lucide-react';
import { chatService, ChatPreview, ChatMessage } from '../../services/chatService';
import './NonMuslimConversation.css';

const NonMuslimConversation: React.FC = () => {
  const [msgInput, setMsgInput] = useState('');
  const [contacts, setContacts] = useState<ChatPreview[]>([]);
  const [activeContact, setActiveContact] = useState<ChatPreview | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  const activeUser = JSON.parse(localStorage.getItem('userData') || '{}')?.user;
  const activeUserId = activeUser?.user_id || activeUser?.id;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect WS and load contacts
  useEffect(() => {
    chatService.connect();
    
    chatService.getMyChats().then(data => {
      setContacts(data || []);
      setLoadingChats(false);
    }).catch(err => {
      console.error('Failed to load chats:', err);
      setLoadingChats(false);
    });

    const handleWsMessage = (event: string, data: Record<string, unknown>) => {
      if (event === 'new_message' || event === 'message_sent') {
        const msg = data.data as ChatMessage;
        
        // Update active chat if relevant
        setMessages(prev => {
          if (!activeContact) return prev;
          const isRelevant = msg.request_id 
             ? msg.request_id === activeContact.request_id
             : (msg.sender_id === activeContact.other_user_id || msg.receiver_id === activeContact.other_user_id);
             
          if (isRelevant) {
             if (!prev.find(m => m.message_id === msg.message_id)) {
               return [...prev, msg];
             }
          }
          return prev;
        });

        // Update contacts preview
        setContacts(prevContacts => prevContacts.map(c => {
          const isRelevant = msg.request_id 
             ? msg.request_id === c.request_id
             : (msg.sender_id === c.other_user_id || msg.receiver_id === c.other_user_id);
          
          if (isRelevant) {
            return {
              ...c,
              last_message: msg.message_text,
              last_message_at: msg.created_at,
              unread_count: (msg.receiver_id === activeUserId && event === 'new_message') ? c.unread_count + 1 : c.unread_count
            };
          }
          return c;
        }));
      }
    };

    chatService.addListener(handleWsMessage);

    return () => {
      chatService.removeListener(handleWsMessage);
      chatService.disconnect();
    };
  }, [activeContact, activeUserId]);

  // Load chat history when contact changes
  useEffect(() => {
    if (activeContact) {
      chatService.getChatHistory(activeContact.other_user_id, activeContact.request_id || undefined)
        .then(data => setMessages(data || []))
        .catch(console.error);
    }
  }, [activeContact]);

  const handleSend = () => {
    if (!msgInput.trim() || !activeContact) return;
    chatService.sendMessage(activeContact.other_user_id, msgInput, activeContact.request_id);
    setMsgInput('');
  };

  return (
    <div className="nm-conversation-page" dir="rtl">
      
      {/* ─── Contacts Sidebar (Right) ─── */}
      <div className="nm-contacts-sidebar">
        <div className="nm-contacts-header">
          <h2 className="nm-contacts-title">المحادثات</h2>
          <div className="nm-search-box">
            <Search size={18} className="nm-search-icon" />
            <input type="text" placeholder="ابحث في المحادثات..." />
          </div>
        </div>

        <div className="nm-contacts-list">
          {loadingChats ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>جاري التحميل...</p>
          ) : contacts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>لا توجد محادثات</p>
          ) : contacts.map((c) => (
            <div 
              key={`${c.other_user_id}-${c.request_id || 'dm'}`} 
              className={`nm-contact-item ${(activeContact && activeContact.other_user_id === c.other_user_id && activeContact.request_id === c.request_id) ? 'active' : ''}`}
              onClick={() => {
                 setActiveContact(c);
                 setContacts(prev => prev.map(ch => (ch.other_user_id === c.other_user_id && ch.request_id === c.request_id) ? {...ch, unread_count: 0} : ch));
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="nm-contact-avatar">
                {/* Fallback to simple icon since we might not have picture */}
                <User size={24} />
              </div>
              <div className="nm-contact-info">
                <div className="nm-contact-top">
                  <h4 className="nm-contact-name">{c.other_party_name}</h4>
                  <span className="nm-contact-time">{(c.last_message_at || '').split('T')[0] || c.last_message_at}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <p className="nm-contact-msg">{c.last_message}</p>
                  {c.unread_count > 0 && <span style={{ background: '#db2777', color: 'white', borderRadius: '50%', padding: '0 6px', fontSize: '12px' }}>{c.unread_count}</span>}
                </div>
              </div>
            </div>
          ))}
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
                  <span className="nm-status-dot"></span> متصل الآن
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="nm-chat-messages">
          {!activeContact ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
               قم باختيار محادثة من القائمة الجانبية
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
               لا توجد رسائل سابقة. ابدأ المحادثة الآن.
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isSent = msg.sender_id == activeUserId;
                return (
                  <div key={msg.message_id} className={`nm-msg-row ${isSent ? 'sent' : 'received'}`}>
                    <div className="nm-msg-avatar">
                      {isSent ? <User size={18} color="#94a3b8" /> : <User size={18} color="#94a3b8" />}
                    </div>
                    <div className="nm-msg-bubble">
                      <p className="nm-msg-text">{msg.message_text}</p>
                      <span className="nm-msg-time">{new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Chat Input */}
        <div className="nm-chat-input-area">
          <div className="nm-input-wrapper">
            <button className="nm-input-btn nm-input-send" onClick={handleSend} disabled={!activeContact || !msgInput.trim()}>
              <Send size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <input 
              type="text" 
              placeholder="اكتب رسالتك هنا..." 
              className="nm-input"
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={!activeContact}
            />
            <button className="nm-input-btn">
              <ImageIcon size={20} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default NonMuslimConversation;
