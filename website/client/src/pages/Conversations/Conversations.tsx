import { useState } from 'react';
import { Search, ChevronDown, Image as ImageIcon, Send } from 'lucide-react';
import './Conversations.css';

// Mock Data
const MOCK_CONTACTS = [
  { id: 1, name: 'Lincoln Rosser', msg: 'نص الرسالة هنا حيث...', time: '10:34 AM', unread: 14, avatar: '/user1.png' },
  { id: 2, name: 'Lincoln Rosser', msg: 'نص الرسالة هنا حيث...', time: '10:34 AM', unread: 14, avatar: '/user2.png' },
  { id: 3, name: 'Lincoln Rosser', msg: 'نص الرسالة هنا حيث...', time: '10:34 AM', unread: 14, avatar: '/user3.png' },
  { id: 4, name: 'Lincoln Rosser', msg: 'نص الرسالة هنا حيث...', time: '10:34 AM', unread: 14, avatar: '/user1.png' },
  { id: 5, name: 'Lincoln Rosser', msg: 'نص الرسالة هنا حيث...', time: '10:34 AM', unread: 14, avatar: '/user2.png' },
  { id: 6, name: 'Lincoln Rosser', msg: 'نص الرسالة هنا حيث...', time: '10:34 AM', unread: 14, avatar: '/user3.png' },
  { id: 7, name: 'Lincoln Rosser', msg: 'نص الرسالة هنا حيث...', time: '10:34 AM', unread: 14, avatar: '/user1.png' },
  { id: 8, name: 'Lincoln Rosser', msg: 'نص الرسالة هنا حيث...', time: '10:34 AM', unread: 14, avatar: '/user2.png' },
];

const MOCK_USER_CHAT = [
  { id: 1, type: 'sent', text: 'اهلا بك كيف حالك', time: '02:06 PM, Sat', isUser: false },
  { id: 2, type: 'received', text: 'بخير الحمدلله', time: '02:06 PM, Sat', isUser: true },
  { id: 3, type: 'received', text: 'بخير الحمدلله', time: '02:06 PM, Sat', isUser: true },
  { id: 4, type: 'sent', text: 'اهلا بك كيف حالك', time: '02:06 PM, Sat', isUser: false },
  { id: 5, type: 'received', text: 'بخير الحمدلله', time: '02:06 PM, Sat', isUser: true },
  { id: 6, type: 'sent', text: 'اهلا بك كيف حالك', time: '02:06 PM, Sat', isUser: false },
];

const MOCK_AI_CHAT = [
  { id: 1, type: 'received', text: 'اهلا بك كيف حالك', time: '02:06 PM, Sat' },
  { id: 2, type: 'sent', text: 'اهلا بك كيف حالك', time: '02:06 PM, Sat' },
  { id: 3, type: 'received', text: 'اهلا بك كيف حالك', time: '02:06 PM, Sat' },
  { id: 4, type: 'sent', text: 'اهلا بك كيف حالك', time: '02:06 PM, Sat' },
  { id: 5, type: 'received', text: 'اهلا بك كيف حالك', time: '02:06 PM, Sat' },
];

const Conversations = () => {
  const [msgInput, setMsgInput] = useState('');

  return (
    <div className="conv-page" dir="rtl">
      
      {/* ─── Right Column: Contacts List ─── */}
      <div className="conv-contacts-col">
        <h2 className="conv-header-title">المحادثات</h2>
        
        <div className="conv-search-box">
          <Search size={16} className="conv-search-icon" />
          <input type="text" placeholder="ابحث ..." className="conv-search-input" />
        </div>

        <div className="conv-contacts-list">
          {MOCK_CONTACTS.map((c) => (
            <div key={c.id} className="conv-contact-item">
              <div className="conv-contact-avatar-wrap">
                <div className="conv-contact-avatar bg-pink-100">
                  <UserAvatar img={c.avatar} />
                </div>
              </div>
              
              <div className="conv-contact-info">
                <div className="conv-contact-top">
                  <h4 className="conv-contact-name">{c.name}</h4>
                  <span className="conv-contact-time">{c.time}</span>
                </div>
                <div className="conv-contact-bottom">
                  <p className="conv-contact-msg">{c.msg}</p>
                  <span className="conv-contact-unread">{c.unread}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Middle Column: Active User Chat ─── */}
      <div className="conv-chat-col">
        <div className="conv-chat-header">
          <h3 className="conv-chat-title">Lincoln Rosser</h3>
          <div className="conv-chat-header-icons">
             <button className="conv-icon-btn">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
             </button>
             <div className="conv-chat-header-avatar bg-pink-100">
               <UserAvatar img="/user1.png" />
             </div>
          </div>
        </div>

        <div className="conv-chat-messages">
          <div className="conv-date-divider"><span>Yesterday</span></div>

          {MOCK_USER_CHAT.map((msg) => (
            <div key={msg.id} className={`conv-msg-row ${msg.type === 'sent' ? 'conv-msg-sent' : 'conv-msg-received'}`}>
               {msg.type === 'sent' && (
                 <div className="conv-msg-avatar bg-red-100"><UserAvatar img="/user-preacher.png" /></div>
               )}
               {msg.type === 'received' && (
                 <div className="conv-msg-avatar bg-pink-100"><UserAvatar img="/user1.png" /></div>
               )}
               
               <div className={`conv-msg-bubble ${msg.type === 'sent' ? 'bg-gold' : 'bg-light'}`}>
                 <p className="conv-msg-text">{msg.text}</p>
                 <span className="conv-msg-time">{msg.time}</span>
               </div>
            </div>
          ))}
        </div>

        <div className="conv-chat-input-area">
          <div className="conv-input-wrapper">
            <button className="conv-input-btn conv-input-send">
              <Send size={18} />
            </button>
            <input 
              type="text" 
              placeholder="اكتب رسالتك ..." 
              className="conv-input"
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
            />
            <button className="conv-input-btn conv-input-attach">
              <ImageIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Left Column: AI Assistant Chat ─── */}
      <div className="conv-ai-col">
        <div className="conv-ai-header">
          <div className="conv-ai-filter">
            <span>كل الفترات</span>
            <ChevronDown size={16} />
          </div>
          <div className="conv-ai-title-wrap">
            <h3 className="conv-ai-title">المساعد الشخصي</h3>
            <div className="conv-ai-avatar">
               {/* AI Bot Icon placeholder */}
               <svg viewBox="0 0 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="20" fill="#0A304E"/>
                  <path d="M12 18h16v8a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4v-8z" fill="#DBA829"/>
                  <circle cx="16" cy="22" r="2" fill="#0A304E"/>
                  <circle cx="24" cy="22" r="2" fill="#0A304E"/>
                  <path d="M16 12h8" stroke="#DBA829" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M20 12v-3" stroke="#DBA829" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="20" cy="8" r="1.5" fill="#DBA829"/>
                  <circle cx="30" cy="28" r="4" fill="#0CBC8B" stroke="#fff" strokeWidth="2"/>
               </svg>
            </div>
          </div>
        </div>

        <div className="conv-chat-messages">
          <div className="conv-date-divider"><span>Yesterday</span></div>

          {MOCK_AI_CHAT.map((msg) => (
            <div key={msg.id} className={`conv-msg-row conv-msg-ai ${msg.type === 'sent' ? 'conv-msg-sent' : 'conv-msg-received'}`}>
               <div className={`conv-msg-bubble ${msg.type === 'sent' ? 'bg-gold-light' : 'bg-gold'}`}>
                 <p className="conv-msg-text">{msg.text}</p>
                 <span className="conv-msg-time">{msg.time}</span>
               </div>
               {msg.type === 'received' && (
                 <div className="conv-msg-avatar">
                   <svg viewBox="0 0 40 40" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                     <circle cx="20" cy="20" r="20" fill="#0A304E"/>
                     <path d="M12 18h16v8a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4v-8z" fill="#DBA829"/>
                     <circle cx="16" cy="22" r="2" fill="#0A304E"/>
                     <circle cx="24" cy="22" r="2" fill="#0A304E"/>
                     <circle cx="30" cy="28" r="4" fill="#0CBC8B" stroke="#fff" strokeWidth="2"/>
                   </svg>
                 </div>
               )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

// Simple avatar fallback component
const UserAvatar = ({ img }: { img: string }) => (
  <div className="avatar-placeholder" title={img}>
    {/* Real app would use <img src={img} /> */}
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  </div>
);

export default Conversations;
