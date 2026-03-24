import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Send, Paperclip, MoreVertical, Phone, MessageCircle } from 'lucide-react';
import './AdminChat.css';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

const MOCK_CONTACTS: Contact[] = [
  { id: '123451', name: 'جمعية الحضارة القديمة', role: 'Association', avatar: 'ج', lastMessage: 'تم إرسال التقارير الشهرية', time: '10:30 ص', unread: 2, online: true },
  { id: '123452', name: 'جمعية مسلمون له', role: 'Association', avatar: 'م', lastMessage: 'هل يمكننا إضافة داعية جديد؟', time: 'أمس', unread: 0, online: false },
  { id: '123456', name: 'عبدالرحمن الأصفر', role: 'Preacher', avatar: 'ج', lastMessage: 'شكراً جزيلاً', time: 'أمس', unread: 0, online: true },
  { id: '123454', name: 'جمعية رسالة الاسلام', role: 'Association', avatar: 'ر', lastMessage: 'نحتاج لمراجعة طلب الأسبوع الماضي', time: 'الثلاثاء', unread: 1, online: false },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  '123451': [
    { id: 'm1', senderId: '123451', text: 'السلام عليكم ورحمة الله، هل يمكنني الاستفسار عن التقارير؟', timestamp: '10:15 ص' },
    { id: 'm2', senderId: 'admin', text: 'وعليكم السلام، بالتأكيد تفضل.', timestamp: '10:20 ص' },
    { id: 'm3', senderId: '123451', text: 'تم إرسال التقارير الشهرية', timestamp: '10:30 ص' },
  ],
  '123452': [
    { id: 'm1', senderId: '123452', text: 'هل يمكننا إضافة داعية جديد؟', timestamp: 'أمس' },
  ],
  '123456': [
    { id: 'm1', senderId: '123456', text: 'لقد تمت الموافقة على الطلب.', timestamp: 'أمس' },
    { id: 'm2', senderId: '123456', text: 'شكراً جزيلاً', timestamp: 'أمس' },
  ],
};

const AdminChat = () => {
  const { userId } = useParams();
  const [activeContactId, setActiveContactId] = useState<string | null>(userId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeContact = MOCK_CONTACTS.find(c => c.id === activeContactId);
  const activeMessages = useMemo(() => 
    activeContactId ? (MOCK_MESSAGES[activeContactId] || []) : []
  , [activeContactId]);

  const filteredContacts = MOCK_CONTACTS.filter(contact => 
    contact.name.includes(searchQuery)
  );

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeContactId, activeMessages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeContactId) return;
    // In a real app, this would send to an API. 
    // Here we just clear the input for demo purposes.
    setMessageInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
          {filteredContacts.map(contact => (
            <div 
              key={contact.id} 
              className={`chat-contact-item ${activeContactId === contact.id ? 'active' : ''}`}
              onClick={() => setActiveContactId(contact.id)}
            >
              <div className="contact-avatar">
                {contact.avatar}
              </div>
              <div className="contact-info">
                <div className="contact-name">{contact.name}</div>
                <div className="contact-preview">{contact.lastMessage}</div>
              </div>
              <div className="contact-meta">
                <span className="contact-time">{contact.time}</span>
                {contact.unread > 0 && (
                  <span className="contact-unread">{contact.unread}</span>
                )}
              </div>
            </div>
          ))}
          {filteredContacts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#a0aec0', fontSize: '0.9rem' }}>
              لا يوجد نتائج
            </div>
          )}
        </div>
      </div>

      {/* ── Main Chat Window ── */}
      {activeContact ? (
        <div className="chat-window">
          {/* Active Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-header-avatar">
                {activeContact.avatar}
              </div>
              <div>
                <h3 className="chat-header-name">{activeContact.name}</h3>
                <div className="chat-header-status">
                  {activeContact.online ? (
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
            {activeMessages.length > 0 ? (
              activeMessages.map(msg => (
                <div key={msg.id} className={`message-wrapper ${msg.senderId === 'admin' ? 'sent' : 'received'}`}>
                  <div className="message-bubble">
                    {msg.text}
                    <span className="message-time">{msg.timestamp}</span>
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
