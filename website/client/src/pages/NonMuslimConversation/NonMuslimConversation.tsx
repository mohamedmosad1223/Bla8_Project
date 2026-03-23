import React, { useState } from 'react';
import { Search, Send, Image as ImageIcon, User } from 'lucide-react';
import './NonMuslimConversation.css';

const MOCK_CONTACTS = [
  { id: 1, name: 'الشيخ عبد الرحمن', msg: 'وعليكم السلام ورحمة الله، كيف يمكنني مساعدتك؟', time: '10:34 ص', unread: 2, avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
  { id: 2, name: 'الشيخ محمد بن صالح', msg: 'بالتأكيد، سأرسل لك المصادر.', time: 'أمس', unread: 0, avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 3, name: 'مؤسسة البلاغ', msg: 'تم تحديد موعد المكاملة الصوتية.', time: 'الإثنين', unread: 0, avatar: 'https://images.unsplash.com/photo-1591154669695-5f2a8d20c089?auto=format&fit=crop&w=150&q=80' },
];

const MOCK_CHAT = [
  { id: 1, type: 'sent', text: 'السلام عليكم ورحمة الله، لدي سؤال بخصوص الصلاة.', time: '10:30 ص' },
  { id: 2, type: 'received', text: 'وعليكم السلام ورحمة الله، كيف يمكنني مساعدتك؟', time: '10:34 ص' },
];

const NonMuslimConversation: React.FC = () => {
  const [msgInput, setMsgInput] = useState('');
  const [messages, setMessages] = useState(MOCK_CHAT);

  const handleSend = () => {
    if (!msgInput.trim()) return;
    setMessages([...messages, { id: Date.now(), type: 'sent', text: msgInput, time: 'الآن' }]);
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
          {MOCK_CONTACTS.map((c, idx) => (
            <div key={c.id} className={`nm-contact-item ${idx === 0 ? 'active' : ''}`}>
              <div className="nm-contact-avatar">
                {c.avatar ? <img src={c.avatar} alt={c.name} /> : <User size={24} />}
              </div>
              <div className="nm-contact-info">
                <div className="nm-contact-top">
                  <h4 className="nm-contact-name">{c.name}</h4>
                  <span className="nm-contact-time">{c.time}</span>
                </div>
                <p className="nm-contact-msg">{c.msg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Active Chat Window (Left) ─── */}
      <div className="nm-chat-window">
        {/* Chat Header */}
        <div className="nm-chat-header">
          <div className="nm-chat-header-user">
            <div className="nm-contact-avatar">
              <img src="https://randomuser.me/api/portraits/men/45.jpg" alt="الشيخ عبد الرحمن" />
            </div>
            <div>
              <h3 className="nm-chat-header-title"> الشيخ عبدالرحمن بن حسين</h3>
              <div className="nm-chat-header-status">
                <span className="nm-status-dot"></span> متصل الآن
              </div>
            </div>
          </div>
          {/* <div className="nm-chat-header-actions">
            <button className="nm-header-icon"><Phone size={20} /></button>
            <button className="nm-header-icon"><Video size={20} /></button>
            <button className="nm-header-icon"><MoreVertical size={20} /></button>
          </div> */}
        </div>

        {/* Chat Messages */}
        <div className="nm-chat-messages">
          <div className="nm-date-divider"><span>اليوم</span></div>

          {messages.map((msg) => (
            <div key={msg.id} className={`nm-msg-row ${msg.type}`}>
               <div className="nm-msg-avatar">
                 {msg.type === 'sent' ? <User size={18} color="#94a3b8" /> : <img src="https://randomuser.me/api/portraits/men/45.jpg" alt="Speaker" />}
               </div>
               <div className="nm-msg-bubble">
                 <p className="nm-msg-text">{msg.text}</p>
                 <span className="nm-msg-time">{msg.time}</span>
               </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="nm-chat-input-area">
          <div className="nm-input-wrapper">
            <button className="nm-input-btn nm-input-send" onClick={handleSend}>
              <Send size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <input 
              type="text" 
              placeholder="اكتب رسالتك هنا..." 
              className="nm-input"
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
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
