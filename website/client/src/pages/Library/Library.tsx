import React, { useState } from 'react';
import { Search, Sliders, FileText, Book, Video, Mic, Share2, Eye, Play, Heart, DownloadCloud } from 'lucide-react';
import './Library.css';

interface LibraryItem {
  id: string;
  type: 'article' | 'book' | 'video' | 'audio';
  title: string;
  category: string;
  author: string;
  imageUrl: string;
  authorImageUrl?: string;
  views?: string;
  pages?: string;
  shares?: string;
  duration?: string;
}

const mockData: LibraryItem[] = [
  {
    id: '1',
    type: 'article',
    category: 'فهم وتطبيق أحاديث النبي ﷺ',
    title: 'أهمية العقيدة الصحيحة في حياة المسلم',
    author: 'بقلم: د. خالد العتيبي',
    imageUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=800&q=80',
    authorImageUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '2',
    type: 'article',
    category: 'فهم وتطبيق أحاديث النبي ﷺ',
    title: 'أهمية العقيدة الصحيحة في حياة المسلم',
    author: 'بقلم: د. خالد العتيبي',
    imageUrl: 'https://images.unsplash.com/photo-1564121211835-e88c852648ab?auto=format&fit=crop&w=800&q=80',
    authorImageUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '3',
    type: 'article',
    category: 'فهم وتطبيق أحاديث النبي ﷺ',
    title: 'أهمية العقيدة الصحيحة في حياة المسلم',
    author: 'بقلم: د. خالد العتيبي',
    imageUrl: 'https://images.unsplash.com/photo-1584281723171-897db66a988d?auto=format&fit=crop&w=800&q=80',
    authorImageUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '4',
    type: 'article',
    category: 'فهم وتطبيق أحاديث النبي ﷺ',
    title: 'أهمية العقيدة الصحيحة في حياة المسلم',
    author: 'بقلم: د. خالد العتيبي',
    imageUrl: 'https://images.unsplash.com/photo-1591154669695-5f2a8d20c089?auto=format&fit=crop&w=800&q=80',
    authorImageUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '7',
    type: 'book',
    category: 'صحيح البخاري',
    title: 'صحيح البخاري - المجلد الأول',
    author: 'محمد بن إسماعيل البخاري',
    imageUrl: 'https://images.unsplash.com/photo-1585829365234-781fdec3d443?auto=format&fit=crop&w=800&q=80',
    views: '120',
    pages: '98',
    shares: '98'
  },
  {
    id: '8',
    type: 'book',
    category: 'صحيح البخاري',
    title: 'صحيح البخاري - المجلد الثاني',
    author: 'محمد بن إسماعيل البخاري',
    imageUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=800&q=80',
    views: '120',
    pages: '98',
    shares: '98'
  },
  {
    id: '9',
    type: 'video',
    category: 'تفسير القرآن',
    title: 'تفسير سورة الفاتحة',
    author: 'الشيخ عبد الرحمن السديس',
    imageUrl: 'https://images.unsplash.com/photo-1564121211835-e88c852648ab?auto=format&fit=crop&w=800&q=80',
    views: '120k',
    duration: '18:30',
    shares: '98k'
  },
  {
    id: '10',
    type: 'video',
    category: 'تفسير القرآن',
    title: 'تفسير سورة الفاتحة',
    author: 'الشيخ عبد الرحمن السديس',
    imageUrl: 'https://images.unsplash.com/photo-1591154669695-5f2a8d20c089?auto=format&fit=crop&w=800&q=80',
    views: '120k',
    duration: '18:30',
    shares: '98k'
  },
  {
    id: '11',
    type: 'audio',
    category: '',
    title: 'سورة البقرة كاملة',
    author: 'الشيخ عبد الرحمن السديس',
    imageUrl: '',
    duration: '2:47:15'
  },
  {
    id: '12',
    type: 'audio',
    category: '',
    title: 'سورة آل عمران كاملة',
    author: 'الشيخ محمد صديق المنشاوي',
    imageUrl: '',
    duration: '3:10:05'
  },
  {
    id: '13',
    type: 'audio',
    category: '',
    title: 'سورة النساء كاملة',
    author: 'الشيخ سعد الغامدي',
    imageUrl: '',
    duration: '4:05:30'
  }
];

const Library: React.FC = () => {
  const [activeTab, setActiveTab ] = useState<'article' | 'book' | 'video' | 'audio'>('article');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = mockData.filter(item => 
    item.type === activeTab &&
    (item.title.includes(searchQuery) || item.author.includes(searchQuery))
  );

  return (
    <div className="library-container" dir="rtl">
      {/* Tabs at the very top */}
      <div className="library-tabs">
        <button 
          className={`tab-item ${activeTab === 'article' ? 'active' : ''}`}
          onClick={() => setActiveTab('article')}
        >
          <FileText size={20} />
          <span>المقالات</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'book' ? 'active' : ''}`}
          onClick={() => setActiveTab('book')}
        >
          <Book size={20} />
          <span>الكتب</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          <Video size={20} />
          <span>الفيديوهات</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          <Mic size={20} />
          <span>الصوتيات</span>
        </button>
      </div>

      {/* Search Header */}
      <div className="library-search-header">
        <div className="filter-btn">
          <Sliders size={20} />
        </div>
        <div className="search-input-inner">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder={activeTab === 'book' ? "ابحث عن كتاب" : activeTab === 'video' ? "ابحث عن فيديو" : activeTab === 'audio' ? "ابحث عن صوتيات" : "ابحث عن مقالة"} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Grid (or List for Audio) */}
      {activeTab === 'audio' ? (
        <div className="audio-list">
          {filteredData.map(item => (
            <div key={item.id} className="audio-list-item">
              <div className="audio-info">
                <span className="audio-title">{item.title}</span>
                <span className="audio-author">{item.author}</span>
              </div>
              <div className="audio-actions">
                <div className="audio-meta">
                  <span>{item.duration}</span>
                  <button className="icon-btn"><DownloadCloud size={18} /></button>
                  <button className="icon-btn liked"><Heart size={18} fill="currentColor" /></button>
                </div>
                <button className="audio-play-btn">
                  <Play size={20} fill="currentColor" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="library-grid">
          {filteredData.map(item => (
            <div key={item.id} className="library-card">
              <div className="card-image-wrap">
                <img src={item.imageUrl} alt={item.title} />
                {item.type === 'video' && (
                  <div className="video-play-overlay">
                    <Play fill="currentColor" size={24} />
                  </div>
                )}
              </div>
              <div className="card-content">
                {item.type === 'article' && (
                  <>
                    <span className="card-category">
                      <Book size={14} /> {item.category}
                    </span>
                    <h3 className="card-title">{item.title}</h3>
                    <div className="card-author-row">
                      <div className="author-avatar">
                        <img src={item.authorImageUrl!} alt={item.author} />
                      </div>
                      <span className="card-author-name">{item.author}</span>
                    </div>
                  </>
                )}

                {(item.type === 'book' || item.type === 'video') && (
                  <>
                     <span className="card-author-name text-center text-gray" style={{ textAlign: 'center', color: '#718096', fontSize: '0.85rem' }}>{item.author}</span>
                     <h3 className="card-title" style={{ textAlign: 'center' }}>{item.title}</h3>
                     <div className="card-stats-footer" style={{ justifyContent: 'center', gap: '16px' }}>
                        <div className="stat-item">
                          <Eye size={14} /> <span>{item.views}</span>
                        </div>
                        <div className="stat-item">
                          {item.type === 'book' ? <Book size={14} /> : <FileText size={14} />} <span>{item.type === 'book' ? item.pages : item.duration}</span>
                        </div>
                        <div className="stat-item">
                          <Share2 size={14} /> <span>{item.shares}</span>
                        </div>
                     </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
