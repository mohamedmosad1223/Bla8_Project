import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Send, Paperclip, MoreVertical, Phone, MessageCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import './AdminChat.css';

interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  message_text: string;
  created_at: string;
  is_mine: boolean;
}

interface Contact {
  other_user_id: number;
  other_party_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_online: boolean;
  avatar: string;
}

const AdminChat = () => {
  const { userId } = useParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState<number | null>(userId ? parseInt(userId) : null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<{name: string, online: boolean} | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const response = await api.get('/messages/my-chats');
      const mapped = response.data.data.map((c: any) => ({
        ...c,
        avatar: c.other_party_name.charAt(0)
      }));
      setContacts(mapped);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  const fetchHistory = useCallback(async (otherId: number) => {
    try {
      setLoadingMessages(true);
      const response = await api.get(`/messages/dm-history/${otherId}`);
      setMessages(response.data.data);
      
      if (response.data.partner) {
        setPartnerInfo({
          name: response.data.partner.other_party_name,
          online: response.data.partner.is_online
        });
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (activeContactId) {
      fetchHistory(activeContactId);
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => fetchHistory(activeContactId), 5000);
      return () => clearInterval(interval);
    } else {
      setPartnerInfo(null);
      setMessages([]);
    }
  }, [activeContactId, fetchHistory]);

  const activeContact = useMemo(() => {
    const fromList = contacts.find(c => c.other_user_id === activeContactId);
    if (fromList) return fromList;
    if (partnerInfo && activeContactId) {
      return {
        other_user_id: activeContactId,
        other_party_name: partnerInfo.name,
        avatar: partnerInfo.name.charAt(0),
        is_online: partnerInfo.online
      } as Contact;
    }
    return activeContactId ? { other_user_id: activeContactId, other_party_name: 'جاري التحميل...', avatar: '؟' } : null;
  }, [activeContactId, contacts, partnerInfo]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeContactId) return;
    
    try {
      const payload = {
        receiver_id: activeContactId,
        message_text: messageInput,
        message_type: 'text'
      };
      await api.post('/messages/', payload);
      setMessageInput('');
      fetchHistory(activeContactId);
      fetchContacts(); // Refresh sidebar to include the new contact
    } catch (err) {
      console.error('Error sending message:', err);
      alert('فشل إرسال الرسالة');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  // Ensure the active contact is always part of the list for display
  const allDisplayContacts = useMemo(() => {
    const list = [...contacts];
    if (activeContact && !list.find(c => c.other_user_id === activeContactId)) {
      list.push({
        ...activeContact,
        last_message: '',
        last_message_at: new Date().toISOString(),
        unread_count: 0,
        is_online: partnerInfo?.online || false
      } as Contact);
    }
    return list;
  }, [contacts, activeContact, activeContactId]);

  const filteredContacts = allDisplayContacts.filter(contact => 
    contact.other_party_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-chat-page">
      
      {/* ── Contacts Sidebar ── */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2 className="chat-sidebar-title">المحادثات</h2>
          <MessageCircle size={22} color="#dba841" />
        </div>
        
        <div className="chat-search-wrapper">
          <Search size={18} className="chat-search-icon" />
          <input 
            type="text" 
            placeholder="بحث عن الرسائل..." 
            className="chat-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="chat-contact-list">
          {loadingContacts ? (
             <div className="chat-loading-center"><Loader2 className="animate-spin text-gold" /></div>
          ) : (
            filteredContacts.map(contact => (
              <div 
                key={contact.other_user_id} 
                className={`chat-contact-item ${activeContactId === contact.other_user_id ? 'active' : ''}`}
                onClick={() => setActiveContactId(contact.other_user_id)}
              >
                <div className="contact-avatar">
                  {contact.avatar}
                </div>
                <div className="contact-info">
                  <div className="contact-name">{contact.other_party_name}</div>
                  <div className="contact-preview">{contact.last_message}</div>
                </div>
                <div className="contact-meta">
                  <span className="contact-time">{formatTime(contact.last_message_at)}</span>
                  {contact.unread_count > 0 && (
                    <span className="contact-unread">{contact.unread_count}</span>
                  )}
                </div>
              </div>
            ))
          )}
          {!loadingContacts && filteredContacts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#a0aec0', fontSize: '0.9rem' }}>
              لا يوجد نتائج
            </div>
          )}
        </div>
      </div>

      {/* ── Main Chat Window ── */}
      {activeContactId ? (
        <div className="chat-window">
          {/* Active Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-header-avatar">
                {activeContact?.avatar}
              </div>
              <div>
                <h3 className="chat-header-name">{activeContact?.other_party_name}</h3>
                <div className="chat-header-status">
                  {(activeContact as any)?.is_online ? (
                    <>
                      <span className="status-dot"></span> متصل الآن
                    </>
                  ) : <span style={{color: '#a0aec0'}}>غير متصل</span>}
                </div>
              </div>
            </div>
            <div className="chat-actions">
              <button className="chat-action-btn"><Phone size={18} /></button>
              <button className="chat-action-btn"><MoreVertical size={18} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {loadingMessages && messages.length === 0 ? (
               <div className="chat-loading-center"><Loader2 className="animate-spin text-gold" /></div>
            ) : messages.length > 0 ? (
              messages.map(msg => (
                <div key={msg.message_id} className={`message-wrapper ${msg.is_mine ? 'sent' : 'received'}`}>
                  <div className="message-bubble">
                    {msg.message_text}
                    <span className="message-time">{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#a0aec0', marginTop: '40px' }}>
                لا توجد رسائل سابقة. ابدأ المحادثة الان!
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <button className="chat-send-btn" onClick={handleSendMessage}>
              <Send size={18} style={{ transform: 'rotate(180deg)', marginLeft: '2px' }} />
            </button>
            <div className="chat-input-wrapper">
              <input 
                type="text" 
                className="chat-input" 
                placeholder="اكتب رسالتك هنا..." 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                dir="rtl"
              />
              <button className="chat-attach-btn">
                <Paperclip size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="chat-window-empty">
          <MessageCircle size={64} color="#e2e8f0" strokeWidth={1} />
          <h3>اختر محادثة للبدء</h3>
        </div>
      )}

    </div>
  );
};

export default AdminChat;
