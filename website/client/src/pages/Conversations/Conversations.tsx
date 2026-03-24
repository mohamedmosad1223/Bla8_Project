import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Image as ImageIcon, Send } from 'lucide-react';
import { chatService, ChatPreview, ChatMessage } from '../../services/chatService';
import './Conversations.css';

// Mock AI Chat until connected
const MOCK_AI_CHAT = [
  { id: 1, type: 'received', text: 'اهلا بك كيف حالك', time: '02:06 PM, Sat' },
];

const Conversations = () => {
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
          // Check if message belongs to active chat window
          if (!activeContact) return prev;
          const isRelevant = msg.request_id 
             ? msg.request_id === activeContact.request_id
             : (msg.sender_id === activeContact.other_user_id || msg.receiver_id === activeContact.other_user_id);
             
          if (isRelevant) {
             // Avoid duplicate append (especially for message_sent vs local update)
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
        
      // Mark as read optionally here
    }
  }, [activeContact]);

  const handleSend = () => {
    if (!msgInput.trim() || !activeContact) return;
    
    chatService.sendMessage(activeContact.other_user_id, msgInput, activeContact.request_id);
    
    // Optimistic UI could go here, but message_sent WS event handles it
    setMsgInput('');
  };

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
          {loadingChats ? (
             <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>جاري التحميل...</p>
          ) : contacts.length === 0 ? (
             <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>لا توجد محادثات</p>
          ) : contacts.map((c) => (
             <div 
               key={`${c.other_user_id}-${c.request_id || 'dm'}`} 
               className={`conv-contact-item ${(activeContact && activeContact.other_user_id === c.other_user_id && activeContact.request_id === c.request_id) ? 'active-contact' : ''}`}
               onClick={() => {
                 setActiveContact(c);
                 // Reset unread count locally when clicking
                 setContacts(prev => prev.map(ch => (ch.other_user_id === c.other_user_id && ch.request_id === c.request_id) ? {...ch, unread_count: 0} : ch));
               }}
               style={{ cursor: 'pointer' }}
             >
              <div className="conv-contact-avatar-wrap">
                <div className="conv-contact-avatar bg-pink-100">
                  <UserAvatar img="/user1.png" />
                </div>
              </div>
              
              <div className="conv-contact-info">
                <div className="conv-contact-top">
                  <h4 className="conv-contact-name">{c.other_party_name}</h4>
                  <span className="conv-contact-time">{(c.last_message_at || '').split('T')[0] || c.last_message_at}</span>
                </div>
                <div className="conv-contact-bottom">
                  <p className="conv-contact-msg">{c.last_message}</p>
                  {c.unread_count > 0 && <span className="conv-contact-unread">{c.unread_count}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Middle Column: Active User Chat ─── */}
      <div className="conv-chat-col">
        <div className="conv-chat-header">
          <h3 className="conv-chat-title" style={{ color: '#ffffff' }}>{activeContact ? activeContact.other_party_name : 'اختر محادثة'}</h3>
          {activeContact && (
            <div className="conv-chat-header-icons">
               <button className="conv-icon-btn">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
               </button>
               <div className="conv-chat-header-avatar bg-pink-100">
                 <UserAvatar img="/user1.png" />
               </div>
            </div>
          )}
        </div>

        <div className="conv-chat-messages">
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
                const isSent = msg.sender_id === activeUserId;
                return (
                  <div key={msg.message_id} className={`conv-msg-row ${isSent ? 'conv-msg-sent' : 'conv-msg-received'}`}>
                   {isSent && (
                     <div className="conv-msg-avatar bg-red-100"><UserAvatar img="/user-preacher.png" /></div>
                   )}
                   {!isSent && (
                     <div className="conv-msg-avatar bg-pink-100"><UserAvatar img="/user1.png" /></div>
                   )}
                   
                    <div className={`conv-msg-bubble ${isSent ? 'bg-gold' : 'bg-light'}`}>
                      <p className="conv-msg-text">{msg.message_text}</p>
                      <span className="conv-msg-time">{new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="conv-chat-input-area">
          <div className="conv-input-wrapper">
            <button className="conv-input-btn conv-input-send" onClick={handleSend} disabled={!activeContact || !msgInput.trim()}>
              <Send size={18} />
            </button>
            <input 
              type="text" 
              placeholder="اكتب رسالتك ..." 
              className="conv-input"
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={!activeContact}
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
